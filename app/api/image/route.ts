import { NextResponse } from "next/server"
import { z } from "zod"
import { PROVIDERS, type ProviderId } from "@/lib/providers"
import { AuthError, verifyRequest } from "@/lib/server/verify-auth"
import { getProviderCredentials } from "@/lib/server/keys"

const requestSchema = z.object({
  provider: z.string().min(1).max(100),
  model: z.string().min(1).max(256),
  prompt: z.string().min(1).max(4000),
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

  const { provider: providerId, model, prompt } = parsed.data
  const provider = PROVIDERS[providerId as keyof typeof PROVIDERS]
  if (!provider || !provider.capabilities.includes("image")) {
    return errorResponse(
      `${providerId} does not support image generation.`,
      400
    )
  }

  const creds = await getProviderCredentials(decoded.uid, providerId as ProviderId)
  if (provider.requiresKey && !creds.apiKey) {
    return errorResponse(
      `${provider.name} requires an API key. Add one in Settings → API Keys.`,
      400
    )
  }

  try {
    const dataUrl = await callHuggingFace(
      creds.baseUrl ?? provider.baseUrl,
      model,
      prompt,
      creds.apiKey ?? ""
    )
    return NextResponse.json({ dataUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider request failed"
    return errorResponse(message, 502)
  }
}

async function callHuggingFace(
  baseUrl: string,
  model: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  const MAX_RETRIES = 3
  const RETRY_DELAY = 2000

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    const response = await fetch(`${baseUrl}/models/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ inputs: prompt }),
    })

    if (response.status === 503 && attempt < MAX_RETRIES) {
      await new Promise((r) => setTimeout(r, RETRY_DELAY * attempt))
      continue
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "")
      if (response.status === 503) {
        throw new Error(
          `Hugging Face model is still loading. Try again in a moment.`
        )
      }
      if (response.status === 429) {
        throw new Error(
          `Hugging Face rate limit exceeded. Wait a moment and try again.`
        )
      }
      if (response.status === 401 || response.status === 403) {
        throw new Error(
          `Hugging Face authentication failed. Check your API key in Settings → API Keys.`
        )
      }
      const bodyPreview = errText.slice(0, 500)
      throw new Error(`Hugging Face error (${response.status}): ${bodyPreview}`)
    }

    const contentType = response.headers.get("content-type") ?? ""

    if (contentType.startsWith("application/json") || contentType.startsWith("text/")) {
      const text = await response.text()
      try {
        const json = JSON.parse(text)
        const errorMsg =
          json?.error ??
          (Array.isArray(json) ? json[0]?.generated_text ?? JSON.stringify(json).slice(0, 300) : JSON.stringify(json).slice(0, 300))
        throw new Error(`Model returned text instead of image: ${errorMsg}`)
      } catch (err) {
        if (err instanceof Error && err.message.startsWith("Model returned text")) throw err
        throw new Error(`Model returned unexpected content: ${text.slice(0, 300)}`)
      }
    }

    const blob = await response.blob()
    if (blob.size === 0) {
      throw new Error("Hugging Face returned an empty response.")
    }
    const arrayBuffer = await blob.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString("base64")
    const outType = blob.type || "image/png"
    return `data:${outType};base64,${base64}`
  }

  throw new Error("Hugging Face model failed to load after retries.")
}
