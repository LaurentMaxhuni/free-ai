import { getAuth } from "firebase/auth"
import { auth } from "./firebase"
import { getSettings } from "./settings"

export type ChatRole = "user" | "assistant" | "system"

export type ChatMessage = {
  role: ChatRole
  content: string
}

export type ChatMode = "text" | "image"

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
  onDone: () => void
  onError: (error: Error) => void
}

export async function generateTextStream(
  messages: ChatMessage[],
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
      messages: messages
        .filter((m) => m.role === "user" || m.role === "assistant" || m.role === "system")
        .map(({ role, content }) => ({ role, content })),
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
        if (typeof parsed.content === "string") {
          callbacks?.onToken(parsed.content)
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

export async function buildImageMessage(prompt: string): Promise<ChatMessage> {
  const settings = getSettings()
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
  const data = await response.json() as { dataUrl?: string; url?: string }
  const value = data.dataUrl ?? data.url
  if (!value) {
    throw new ApiError("Provider returned no image", 502)
  }
  return { role: "assistant", content: `${IMAGE_PREFIX}${value}` }
}
