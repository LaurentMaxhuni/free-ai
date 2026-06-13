import { getAuth } from "firebase/auth"
import { auth } from "./firebase"
import { getSettings } from "./settings"

export type ChatRole = "user" | "assistant" | "system"

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string; detail?: "low" | "high" | "auto" } }

export type FileAttachment = {
  name: string
  type: "image" | "text" | "pdf" | "code"
  mimeType: string
  data: string
  size: number
}

export type ChatMessage = {
  role: ChatRole
  content: string
  attachments?: FileAttachment[]
}

export type ChatMode = "text" | "image"

const MAX_FILE_SIZE = 10 * 1024 * 1024
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"]
const TEXT_TYPES = [
  "text/plain", "text/html", "text/css", "text/csv",
  "application/json", "application/xml",
]
const CODE_TYPES = [
  "text/javascript", "application/javascript", "application/typescript",
  "text/typescript", "text/jsx", "text/tsx",
  "text/x-python", "text/x-java", "text/x-rust", "text/x-go",
  "text/x-c", "text/x-cpp", "text/x-ruby", "text/x-php",
  "text/x-swift", "text/x-kotlin", "text/x-scala",
  "text/x-sh", "text/x-yaml", "text/x-toml", "text/markdown",
  "text/x-sql", "text/x-dockerfile",
]
const PDF_TYPES = ["application/pdf"]

export function getFileCategory(mimeType: string): FileAttachment["type"] | null {
  if (IMAGE_TYPES.includes(mimeType)) return "image"
  if (PDF_TYPES.includes(mimeType)) return "pdf"
  if (CODE_TYPES.includes(mimeType) || mimeType.startsWith("text/")) return "code"
  return null
}

export async function readFileAsAttachment(file: File): Promise<FileAttachment | null> {
  if (file.size > MAX_FILE_SIZE) return null

  const category = getFileCategory(file.type)
  if (!category) return null

  const base = { name: file.name, mimeType: file.type, size: file.size, type: category }

  if (category === "image") {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve({ ...base, data: reader.result as string })
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(file)
    })
  }

  if (category === "pdf") {
    const text = await file.text()
    return { ...base, data: text.slice(0, 50000), type: "text" }
  }

  const text = await file.text()
  return { ...base, data: text.slice(0, 100000), type: "code" }
}

const IMAGE_PREFIX = "__FREE_AI_IMAGE__"

export function isImageMessage(message: ChatMessage): boolean {
  return (
    message.role === "assistant" &&
    message.content.startsWith(IMAGE_PREFIX)
  )
}

export function getImageUrl(message: ChatMessage): string | null {
  if (!isImageMessage(message)) return null
  return message.content.slice(IMAGE_PREFIX.length)
}

class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = "ApiError"
    this.status = status
  }
}

async function getIdToken(): Promise<string> {
  if (!auth) {
    throw new ApiError("Not signed in.", 401)
  }
  const user = auth.currentUser ?? (await new Promise<ReturnType<typeof getAuth>["currentUser"]>((resolve, reject) => {
    const unsubscribe = getAuth().onAuthStateChanged(
      (u) => {
        unsubscribe()
        resolve(u)
      },
      (err) => {
        unsubscribe()
        reject(err)
      }
    )
  }))
  if (!user) {
    throw new ApiError("Not signed in.", 401)
  }
  return user.getIdToken()
}

export type StreamCallbacks = {
  onToken: (token: string) => void
  onReasoning?: (token: string) => void
  onDone: () => void
  onError: (error: Error) => void
}

export type ApiMessage = {
  role: ChatRole
  content: string | ChatContentPart[]
}

export async function generateTextStream(
  messages: ApiMessage[],
  signal?: AbortSignal,
  callbacks?: StreamCallbacks
): Promise<void> {
  const settings = getSettings()
  const token = await getIdToken()

  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      provider: settings.provider,
      model: settings.textModel,
      messages: messages.filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system"),
    }),
    signal,
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = typeof data?.error === "string" ? data.error : `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }

  if (!response.body) {
    throw new ApiError("No response body", 500)
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data: ")) continue
      const data = trimmed.slice(6)
      if (data === "[DONE]") {
        callbacks?.onDone()
        return
      }

      try {
        const parsed = JSON.parse(data)
        if (parsed.error) {
          throw new ApiError(parsed.error, 502)
        }
        const choice = parsed.choices?.[0]
        const delta = choice?.delta
        if (delta?.content) {
          callbacks?.onToken(delta.content)
        } else if (typeof parsed.content === "string") {
          callbacks?.onToken(parsed.content)
        }
        if (delta?.reasoning_content) {
          callbacks?.onReasoning?.(delta.reasoning_content)
        } else if (typeof parsed.reasoning_content === "string") {
          callbacks?.onReasoning?.(parsed.reasoning_content)
        }
      } catch (err) {
        if (err instanceof ApiError) throw err
      }
    }
  }

  callbacks?.onDone()
}

export async function generateText(
  messages: ChatMessage[],
  signal?: AbortSignal
): Promise<string> {
  let result = ""
  await generateTextStream(messages, signal, {
    onToken: (token) => { result += token },
    onDone: () => {},
    onError: () => {},
  })
  return result
}

export function buildMultimodalContent(message: ChatMessage): string | ChatContentPart[] {
  const atts = message.attachments
  if (!atts || atts.length === 0) return message.content

  const parts: ChatContentPart[] = []
  if (message.content) {
    parts.push({ type: "text", text: message.content })
  }
  for (const att of atts) {
    if (att.type === "image") {
      parts.push({ type: "image_url", image_url: { url: att.data, detail: "auto" } })
    } else {
      const lang = att.name.split(".").pop()
      parts.push({ type: "text", text: `\n\nFile: ${att.name}\n\`\`\`${lang ?? ""}\n${att.data}\n\`\`\`` })
    }
  }
  return parts
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function buildPollinationsUrl(prompt: string): string {
  const seed = hashString(prompt.trim().toLowerCase())
  const params = new URLSearchParams({
    width: "1024",
    height: "1024",
    nologo: "true",
    enhance: "true",
    seed: String(seed),
  })
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?${params.toString()}`
}

export async function buildImageMessage(prompt: string): Promise<ChatMessage> {
  const settings = getSettings()

  if (settings.provider === "pollinations") {
    const url = buildPollinationsUrl(prompt)
    return { role: "assistant", content: `${IMAGE_PREFIX}${url}` }
  }

  const token = await getIdToken()
  const response = await fetch("/api/image", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      provider: settings.provider,
      model: settings.imageModel,
      prompt: prompt.trim(),
    }),
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    const message = typeof data?.error === "string" ? data.error : `Request failed (${response.status})`
    throw new ApiError(message, response.status)
  }
  const data = await response.json() as { dataUrl?: string; error?: string }

  if (data.error) {
    throw new ApiError(data.error, 502)
  }

  if (!data.dataUrl) {
    const text = JSON.stringify(data).slice(0, 300)
    throw new ApiError(`Provider returned no image. Response: ${text}`, 502)
  }

  return { role: "assistant", content: `${IMAGE_PREFIX}${data.dataUrl}` }
}
