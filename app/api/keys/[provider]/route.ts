import { NextResponse } from "next/server"
import { PROVIDERS, type ProviderId } from "@/lib/providers"
import { AuthError, verifyRequest } from "@/lib/server/verify-auth"
import { clearSecret } from "@/lib/server/keys"

const PROVIDER_IDS = Object.keys(PROVIDERS) as ProviderId[]

function isProviderId(value: string): value is ProviderId {
  return (PROVIDER_IDS as string[]).includes(value)
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: err.status })
    }
    throw err
  }

  const { provider } = await context.params
  if (!isProviderId(provider)) {
    return NextResponse.json({ error: "Unknown provider" }, { status: 400 })
  }

  await Promise.all([
    clearSecret(decoded.uid, provider, "apiKey"),
    clearSecret(decoded.uid, provider, "baseUrl"),
  ])

  return NextResponse.json({ ok: true })
}
