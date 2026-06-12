import { NextResponse } from "next/server"
import { verifyRequest } from "@/lib/server/verify-auth"
import { getProviderCredentials } from "@/lib/server/keys"

export async function GET(request: Request) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const creds = await getProviderCredentials(decoded.uid, "groq")
  if (!creds.apiKey) {
    return NextResponse.json(
      { error: "No Groq API key configured. Add one in Settings." },
      { status: 400 }
    )
  }

  try {
    const response = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${creds.apiKey}` },
    })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      return NextResponse.json(
        { error: `Groq API error (${response.status}): ${text}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const raw = Array.isArray(data.data) ? data.data : []
    const models = raw
      .filter((m: any) => m?.id && m.active !== false)
      .map((m: any) => ({ id: m.id, label: m.id.replace(/-/g, " ") }))
      .sort((a: { label: string }, b: { label: string }) =>
        a.label.localeCompare(b.label)
      )

    return NextResponse.json({ models })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach Groq API" },
      { status: 502 }
    )
  }
}
