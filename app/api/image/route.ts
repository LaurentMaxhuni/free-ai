import { NextResponse } from "next/server"
import { z } from "zod"
import { PROVIDERS, type ProviderId } from "@/lib/providers"
import { AuthError, verifyRequest } from "@/lib/server/verify-auth"
import { getProviderCredentials } from "@/lib/server/keys"

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]

const requestSchema = z.object({
  provider: z.enum(PROVIDER_IDS as [ProviderId, ...ProviderId[]]),
  model: z.string().min(1).max(256),
  prompt: z.string().min(1).max(4000),
})

function errorResponse(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

function hashString(input: string): number {
  let hash = 0
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
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
  const provider = PROVIDERS[providerId]
  if (!provider.capabilities.includes("image")) {
    return errorResponse(
      `${provider.name} does not support image generation.`,
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
    if (providerId === "huggingface") {
      const dataUrl = await callHuggingFace(
        creds.baseUrl ?? provider.baseUrl,
        model,
        prompt,
        creds.apiKey ?? ""
      )
      return NextResponse.json({ dataUrl })
    }
    const url = buildPollinationsUrl(prompt)
    const dataUrl = await callPollinations(url)
    return NextResponse.json({ dataUrl })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Provider request failed"
    return errorResponse(message, 502)
  }
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

async function callPollinations(url: string): Promise<string> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30_000)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "image/*" },
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`Pollinations error (${res.status}): ${text.slice(0, 200)}`)
    }
    const blob = await res.blob()
    if (blob.type.startsWith("text/") || blob.size < 100) {
      const text = await blob.text()
      throw new Error(`Pollinations returned non-image: ${text.slice(0, 200)}`)
    }
    const buffer = await blob.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    return `data:${blob.type || "image/png"};base64,${base64}`
  } finally {
    clearTimeout(timeout)
  }
}

async function callHuggingFace(
  baseUrl: string,
  model: string,
  prompt: string,
  apiKey: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: prompt }),
  })
  if (!response.ok) {
    const errText = await response.text().catch(() => "")
    throw new Error(`Hugging Face error (${response.status}): ${errText}`)
  }
  const blob = await response.blob()
  const arrayBuffer = await blob.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString("base64")
  const contentType = blob.type || "image/png"
  return `data:${contentType};base64,${base64}`
}
