import { NextResponse } from "next/server"
import { verifyRequest } from "@/lib/server/verify-auth"
import { getProviderCredentials } from "@/lib/server/keys"

const HF_ENDPOINT =
  "https://api-inference.huggingface.co/models?pipeline_tag=text-to-image&sort=downloads&direction=-1&limit=60"

export async function GET(request: Request) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const creds = await getProviderCredentials(decoded.uid, "huggingface")

  try {
    const headers: Record<string, string> = {}
    if (creds.apiKey) {
      headers["Authorization"] = `Bearer ${creds.apiKey}`
    }

    const response = await fetch(HF_ENDPOINT, { headers })

    if (!response.ok) {
      const text = await response.text().catch(() => "")
      return NextResponse.json(
        { error: `Hugging Face API error (${response.status}): ${text}` },
        { status: 502 }
      )
    }

    const data = await response.json()
    const raw = Array.isArray(data) ? data : []
    const models = raw
      .filter(
        (m: any) =>
          m?.id &&
          m?.pipeline_tag === "text-to-image" &&
          m?.inference !== false &&
          (typeof m?.inference === "string" || m?.inference === true)
      )
      .map((m: any) => ({
        id: m.id,
        label: m.id.split("/").pop()?.replace(/-/g, " ") ?? m.id,
      }))
      .sort((a: { label: string }, b: { label: string }) =>
        a.label.localeCompare(b.label)
      )

    return NextResponse.json({ models })
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach Hugging Face API" },
      { status: 502 }
    )
  }
}
