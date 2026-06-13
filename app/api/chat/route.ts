import { NextResponse } from "next/server"
import { z } from "zod"
import { PROVIDERS, type ProviderId } from "@/lib/providers"
import { AuthError, verifyRequest } from "@/lib/server/verify-auth"
import { getProviderCredentials } from "@/lib/server/keys"

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]

const contentPartSchema: z.ZodType<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string; detail?: string } }> = z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), text: z.string().min(1).max(50000) }),
  z.object({ type: z.literal("image_url"), image_url: z.object({ url: z.string().min(1).max(500000), detail: z.string().optional() }) }),
])

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([z.string().min(1).max(20000), z.array(contentPartSchema).min(1).max(100)]),
})

const requestSchema = z.object({
  provider: z.enum(PROVIDER_IDS as [ProviderId, ...ProviderId[]]),
  model: z.string().min(1).max(256),
  messages: z.array(messageSchema).min(1).max(200),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return errorResponse(err.message, err.status)
    }
    throw err
  }

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return errorResponse("Invalid request body", 400)
  }

  const { provider: providerId, model, messages } = parsed.data
  const provider = PROVIDERS[providerId]
  if (!provider.capabilities.includes("text")) {
    return errorResponse(
      `${provider.name} does not support text generation.`,
      400
    )
  }

  const creds = await getProviderCredentials(decoded.uid, providerId)
  if (provider.requiresKey && !creds.apiKey) {
    return errorResponse(
      `${provider.name} requires an API key. Add one in Settings → API Keys.`,
      400
    )
  }

  try {
    const baseUrl = creds.baseUrl ?? provider.baseUrl

    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        const send = (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        try {
          if (providerId === "ollama") {
            await streamOllama(baseUrl, model, messages, send)
          } else {
            await streamOpenAICompatible(
              baseUrl,
              provider.chatPath ?? "/chat/completions",
              model,
              messages,
              creds.apiKey ?? "",
              send
            )
          }
          send("[DONE]")
        } catch (err) {
          const message = err instanceof Error ? err.message : "Provider request failed"
          send(JSON.stringify({ error: message }))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider request failed"
    return errorResponse(message, 502)
  }
}

type ChatMessage = z.infer<typeof messageSchema>
type SendFn = (data: string) => void

async function streamOpenAICompatible(
  baseUrl: string,
  path: string,
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  send: SendFn
): Promise<void> {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(`Provider error (${response.status}): ${errText}`)
  }

  if (!response.body) {
    throw new Error("No response body from provider")
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
      if (data === "[DONE]") return

      try {
        const parsed = JSON.parse(data)
        const delta =
          parsed?.choices?.[0]?.delta?.content ??
          parsed?.choices?.[0]?.text ??
          parsed?.content
        if (typeof delta === "string" && delta) {
          send(JSON.stringify({ content: delta }))
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}

async function streamOllama(
  baseUrl: string,
  model: string,
  messages: ChatMessage[],
  send: SendFn
): Promise<void> {
  const response = await fetch(`${baseUrl}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: true }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(`Ollama error (${response.status}): ${errText}`)
  }

  if (!response.body) {
    throw new Error("No response body from Ollama")
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
      if (!trimmed) continue
      try {
        const parsed = JSON.parse(trimmed)
        const content = parsed?.message?.content
        if (typeof content === "string" && content) {
          send(JSON.stringify({ content }))
        }
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}
