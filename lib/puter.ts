import { init } from "@heyputer/puter.js/src/init.cjs"
import type { ChatOptions } from "@heyputer/puter.js"

let puterInstance: ReturnType<typeof init> | null = null

export function getPuter(authToken: string) {
  if (!puterInstance) {
    puterInstance = init(authToken)
  }
  return puterInstance
}

export async function puterChat(
  authToken: string,
  model: string,
  messages: { role: string; content: string }[]
) {
  const puter = getPuter(authToken)
  const result = await puter.ai.chat(
    messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { model } satisfies ChatOptions
  )
  return result?.message?.content ?? ""
}

export async function puterChatStream(
  authToken: string,
  model: string,
  messages: { role: string; content: string }[],
  signal?: AbortSignal,
  onToken?: (token: string) => void
): Promise<string> {
  const response = await fetch(
    "https://api.puter.com/puterai/openai/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ model, messages, stream: true }),
      signal,
    }
  )

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(`Puter error (${response.status}): ${errText}`)
  }

  if (!response.body) {
    throw new Error("No response body from Puter")
  }

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let fullContent = ""

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
      if (data === "[DONE]") break

      try {
        const parsed = JSON.parse(data)
        const delta = parsed?.choices?.[0]?.delta?.content
        if (typeof delta === "string" && delta) {
          fullContent += delta
          onToken?.(delta)
        }
      } catch {
        // skip malformed JSON
      }
    }
  }

  return fullContent
}
