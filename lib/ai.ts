import { getAuth } from "firebase/auth"
import { auth } from "./firebase"
import { getSettings } from "./settings"
import {
  MAX_ATTACHMENT_TEXT_LENGTH,
  MAX_CONTENT_PART_TEXT_LENGTH,
  MAX_FILE_SIZE,
  MAX_IMAGE_PROMPT_LENGTH,
} from "./limits"
import type { ProviderId } from "./providers"

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
  reasoning?: string
  attachments?: FileAttachment[]
}

export type ChatMode = "text" | "image"

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/svg+xml"]
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
    try {
      const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs")
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/legacy/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString()
      const document = await pdfjs.getDocument({
        data: new Uint8Array(await file.arrayBuffer()),
      }).promise
      const pages: string[] = []
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber)
        const textContent = await page.getTextContent()
        const pageText = textContent.items
          .map((item) => ("str" in item ? item.str : ""))
          .join(" ")
          .trim()
        if (pageText) pages.push(pageText)
      }
      return {
        ...base,
        data: pages.join("\n\n").slice(0, MAX_ATTACHMENT_TEXT_LENGTH),
        type: "pdf",
      }
    } catch {
      return null
    }
  }

  const text = await file.text()
  return { ...base, data: text.slice(0, MAX_ATTACHMENT_TEXT_LENGTH), type: "code" }
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

function emitStreamData(data: string, callbacks?: StreamCallbacks): boolean {
  if (data === "[DONE]") {
    callbacks?.onDone()
    return true
  }

  try {
    const parsed = JSON.parse(data)
    if (parsed.error) throw new ApiError(parsed.error, 502)
    const choice = parsed.choices?.[0]
    const delta = choice?.delta
    const content = delta?.content ?? choice?.text
    if (typeof content === "string" && content) callbacks?.onToken(content)
    else if (typeof parsed.content === "string" && parsed.content) callbacks?.onToken(parsed.content)

    const reasoning =
      delta?.reasoning_content ??
      delta?.reasoning ??
      parsed.reasoning_content ??
      parsed.reasoning
    if (typeof reasoning === "string" && reasoning) callbacks?.onReasoning?.(reasoning)
  } catch (error) {
    if (error instanceof ApiError) throw error
    // Providers occasionally emit comments or malformed keep-alive chunks.
  }
  return false
}

function emitSseLine(line: string, callbacks?: StreamCallbacks): boolean {
  const trimmed = line.trim()
  if (!trimmed || !trimmed.startsWith("data:")) return false
  return emitStreamData(trimmed.slice(5).trimStart(), callbacks)
}

export async function generateTextStream(
  messages: ApiMessage[],
  signal?: AbortSignal,
  callbacks?: StreamCallbacks
): Promise<void> {
  const settings = getSettings()
  if (settings.provider === "ollama") {
    await generateOllamaTextStream(messages, settings.ollamaBaseUrl, signal, callbacks)
    return
  }
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
      if (emitSseLine(line, callbacks)) {
        return
      }
    }
  }

  buffer += decoder.decode()
  if (buffer.trim() && emitSseLine(buffer, callbacks)) {
    return
  }
  callbacks?.onDone()
}

async function generateOllamaTextStream(
  messages: ApiMessage[],
  configuredBaseUrl: string,
  signal?: AbortSignal,
  callbacks?: StreamCallbacks
): Promise<void> {
  const settings = getSettings()
  let resolvedBaseUrl = configuredBaseUrl || "http://localhost:11434"
  if (resolvedBaseUrl === "http://localhost:11434") {
    try {
      const token = await getIdToken()
      const response = await fetch("/api/keys", {
        headers: { Authorization: `Bearer ${token}` },
        signal,
      })
      const data = await response.json().catch(() => ({})) as {
        configured?: Array<{ provider?: string; baseUrl?: string | null }>
      }
      const configured = data.configured?.find((item) => item.provider === "ollama")?.baseUrl
      if (configured) resolvedBaseUrl = configured
    } catch {
      if (signal?.aborted) {
        throw new DOMException("The request was aborted.", "AbortError")
      }
      // The browser can still use its local default if the settings endpoint
      // is unavailable.
    }
  }
  const baseUrl = resolvedBaseUrl.replace(/\/+$/, "")
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: settings.textModel, messages, stream: true }),
    signal,
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => "")
    throw new ApiError(`Ollama error (${response.status}): ${detail}`, response.status)
  }
  if (!response.body) throw new ApiError("No response body from Ollama", 502)

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  const emitLine = (line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    try {
      const parsed = JSON.parse(trimmed)
      if (parsed.error) throw new ApiError(parsed.error, 502)
      const content = parsed.message?.content ?? parsed.content
      if (typeof content === "string" && content) callbacks?.onToken(content)
      const reasoning = parsed.message?.thinking ?? parsed.thinking ?? parsed.reasoning
      if (typeof reasoning === "string" && reasoning) callbacks?.onReasoning?.(reasoning)
    } catch (error) {
      if (error instanceof ApiError) throw error
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) emitLine(line)
  }
  buffer += decoder.decode()
  if (buffer.trim()) emitLine(buffer)
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
  if (isImageMessage(message)) {
    return "[A generated image was returned in the previous turn and is omitted from text history.]"
  }
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
      parts.push({
        type: "text",
        text: `\n\nFile: ${att.name}\n\`\`\`${lang ?? ""}\n${att.data}\n\`\`\``.slice(0, MAX_CONTENT_PART_TEXT_LENGTH),
      })
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

function buildPollinationsUrl(prompt: string, model: string): string {
  const seed = hashString(prompt.trim().toLowerCase())
  const params = new URLSearchParams({
    width: "1024",
    height: "1024",
    nologo: "true",
    enhance: "true",
    seed: String(seed),
    ...(model ? { model } : {}),
  })
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt.trim())}?${params.toString()}`
}

export async function buildImageMessage(
  prompt: string,
  signal?: AbortSignal,
  requestSettings?: { provider: ProviderId; imageModel: string }
): Promise<ChatMessage> {
  const settings = getSettings()
  const provider = requestSettings?.provider ?? settings.provider
  const imageModel = requestSettings?.imageModel ?? settings.imageModel
  const cleanPrompt = prompt.trim().slice(0, MAX_IMAGE_PROMPT_LENGTH)

  if (provider === "pollinations") {
    const url = buildPollinationsUrl(cleanPrompt, imageModel)
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
      provider,
      model: imageModel,
      prompt: cleanPrompt,
    }),
    signal,
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
