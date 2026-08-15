import { NextResponse } from "next/server"
import { z } from "zod"
import { PROVIDERS, type ProviderId } from "@/lib/providers"
import {
  MAX_CONTENT_PARTS,
  MAX_CONTENT_PART_TEXT_LENGTH,
  MAX_IMAGE_URL_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_MESSAGES,
} from "@/lib/limits"
import { AuthError, verifyRequest } from "@/lib/server/verify-auth"
import { getProviderCredentials } from "@/lib/server/keys"
import { ModelValidationError, validateChatModel } from "@/lib/server/model-validation"

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]

const contentPartSchema: z.ZodType<
  { type: "text"; text: string } |
  { type: "image_url"; image_url: { url: string; detail?: string } }
> = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("text"),
    text: z.string().min(1).max(MAX_CONTENT_PART_TEXT_LENGTH),
  }),
  z.object({
    type: z.literal("image_url"),
    image_url: z.object({
      url: z.string().min(1).max(MAX_IMAGE_URL_LENGTH),
      detail: z.enum(["low", "high", "auto"]).optional(),
    }),
  }),
])

const messageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z.union([
    z.string().min(1).max(MAX_MESSAGE_LENGTH),
    z.array(contentPartSchema).min(1).max(MAX_CONTENT_PARTS),
  ]),
})

const requestSchema = z.object({
  provider: z.enum(PROVIDER_IDS as [ProviderId, ...ProviderId[]]),
  model: z.string().min(1).max(256),
  messages: z.array(messageSchema).min(1).max(MAX_MESSAGES),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: Request) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch (err) {
    if (err instanceof AuthError) return errorResponse(err.message, err.status)
    throw err
  }

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) return errorResponse("Invalid request body", 400)

  const { provider: providerId, model, messages } = parsed.data
  const provider = PROVIDERS[providerId]
  if (!provider.capabilities.includes("text")) {
    return errorResponse(`${provider.name} does not support text generation.`, 400)
  }

  // A browser must call the user's Ollama instance directly. Proxying this
  // route from a deployed server makes localhost refer to the server itself.
  if (providerId === "ollama") {
    return errorResponse(
      "Ollama requests are sent directly from your browser. Check the Ollama URL and CORS settings.",
      400
    )
  }

  let apiKey = ""
  const baseUrl = provider.baseUrl

  if (providerId === "freeai") {
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID
    apiKey = process.env.CLOUDFLARE_API_TOKEN ?? ""
    if (!accountId || !apiKey) {
      return errorResponse(
        "Free.ai model is not configured. Select Pollinations or set CLOUDFLARE_ACCOUNT_ID and CLOUDFLARE_API_TOKEN in your environment.",
        500
      )
    }
    try {
      await validateChatModel(providerId, model, apiKey)
    } catch (error) {
      if (error instanceof ModelValidationError) return errorResponse(error.message, error.status)
      throw error
    }
    return streamProvider(
      request,
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1`,
      provider.chatPath ?? "/chat/completions",
      model,
      messages,
      apiKey
    )
  }

  const creds = await getProviderCredentials(decoded.uid, providerId)
  if (provider.requiresKey && !creds.apiKey) {
    return errorResponse(
      `${provider.name} requires an API key. Add one in Settings → API Keys.`,
      400
    )
  }
  apiKey = creds.apiKey ?? ""

  try {
    await validateChatModel(providerId, model, apiKey)
  } catch (error) {
    if (error instanceof ModelValidationError) return errorResponse(error.message, error.status)
    throw error
  }

  return streamProvider(
    request,
    baseUrl,
    provider.chatPath ?? "/chat/completions",
    model,
    messages,
    apiKey
  )
}

type ChatMessage = z.infer<typeof messageSchema>
type SendFn = (data: string) => void
type ProviderChunk = {
  error?: unknown
  content?: unknown
  reasoning?: unknown
  reasoning_content?: unknown
  choices?: Array<{
    text?: unknown
    delta?: {
      content?: unknown
      reasoning?: unknown
      reasoning_content?: unknown
    }
  }>
}

function streamProvider(
  request: Request,
  baseUrl: string,
  path: string,
  model: string,
  messages: ChatMessage[],
  apiKey: string
): Response {
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const send: SendFn = (data) => {
        try {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        } catch {
          // The browser may have closed the stream while the provider was
          // still producing tokens.
        }
      }

      try {
        await streamOpenAICompatible(
          baseUrl,
          path,
          model,
          messages,
          apiKey,
          send,
          request.signal
        )
        send("[DONE]")
      } catch (err) {
        if (!request.signal.aborted) {
          const message = err instanceof Error ? err.message : "Provider request failed"
          send(JSON.stringify({ error: message }))
        }
      } finally {
        try { controller.close() } catch {}
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}

function emitOpenAIChunk(data: string, send: SendFn): boolean {
  if (data === "[DONE]") return true
  let parsed: ProviderChunk
  try {
    const candidate: unknown = JSON.parse(data)
    if (!candidate || typeof candidate !== "object") return false
    parsed = candidate as ProviderChunk
  } catch {
    // Ignore provider keep-alives and malformed individual chunks.
    return false
  }
  if (parsed?.error) throw new Error(String(parsed.error))
  const choice = parsed.choices?.[0]
  const delta = choice?.delta
  const content = delta?.content ?? choice?.text ?? parsed.content
  if (typeof content === "string" && content) send(JSON.stringify({ content }))

  const reasoning =
    delta?.reasoning_content ??
    delta?.reasoning ??
    parsed?.reasoning_content ??
    parsed?.reasoning
  if (typeof reasoning === "string" && reasoning) send(JSON.stringify({ reasoning }))
  return false
}

async function streamOpenAICompatible(
  baseUrl: string,
  path: string,
  model: string,
  messages: ChatMessage[],
  apiKey: string,
  send: SendFn,
  signal: AbortSignal
): Promise<void> {
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({ model, messages, stream: true, max_tokens: 8192 }),
    signal,
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(`Provider error (${response.status}): ${errText}`)
  }
  if (!response.body) throw new Error("No response body from provider")

  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ""
  let providerFinished = false

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""
    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith("data:")) continue
      if (emitOpenAIChunk(trimmed.slice(5).trimStart(), send)) {
        providerFinished = true
        return
      }
    }
  }

  buffer += decoder.decode()
  if (!providerFinished && buffer.trim()) {
    const trimmed = buffer.trim()
    if (trimmed.startsWith("data:")) {
      providerFinished = emitOpenAIChunk(trimmed.slice(5).trimStart(), send)
    }
  }
}
