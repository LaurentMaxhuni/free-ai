import { NextResponse } from "next/server"
import { z } from "zod"
import { PROVIDERS, type ProviderId } from "@/lib/providers"
import { AuthError, verifyRequest } from "@/lib/server/verify-auth"
import { listConfiguredProviders, setSecret } from "@/lib/server/keys"

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]

const setKeySchema = z.object({
  provider: z.enum(PROVIDER_IDS as [ProviderId, ...ProviderId[]]),
  apiKey: z.string().min(1).max(512).optional(),
  baseUrl: z.string().url().max(512).refine((value) => /^https?:\/\//i.test(value), "Base URL must use HTTP or HTTPS.").optional(),
})

export async function GET(request: Request) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }
  const result = await listConfiguredProviders(decoded.uid)
  return NextResponse.json(result)
}

export async function POST(request: Request) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  const body = await request.json().catch(() => null)
  const parsed = setKeySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { provider, apiKey, baseUrl } = parsed.data
  const providerConfig = PROVIDERS[provider]
  if (apiKey && !providerConfig.requiresKey) {
    return NextResponse.json(
      { error: `${providerConfig.name} does not accept an API key.` },
      { status: 400 }
    )
  }
  if (baseUrl && provider !== "ollama") {
    return NextResponse.json(
      { error: "Custom base URLs are supported only for browser-direct Ollama connections." },
      { status: 400 }
    )
  }
  if (!apiKey && !baseUrl) {
    return NextResponse.json(
      { error: "Provide at least one of apiKey or baseUrl." },
      { status: 400 }
    )
  }
  if (apiKey) {
    await setSecret(decoded.uid, provider, "apiKey", apiKey)
  }
  if (baseUrl) {
    await setSecret(decoded.uid, provider, "baseUrl", baseUrl)
  }

  return NextResponse.json({ ok: true })
}
