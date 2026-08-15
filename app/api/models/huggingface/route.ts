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

    const data = await response.json() as unknown
    const raw = (Array.isArray(data) ? data : []) as Array<Record<string, unknown>>
    const models = raw
      .filter(
        (model) =>
          typeof model.id === "string" &&
          model.pipeline_tag === "text-to-image" &&
          model.inference !== false &&
          (typeof model.inference === "string" || model.inference === true)
      )
      .map((model) => ({
        id: model.id as string,
        label: (model.id as string).split("/").pop()?.replace(/-/g, " ") ?? model.id as string,
      }))
      .sort((a: { label: string }, b: { label: string }) =>
        a.label.localeCompare(b.label)
      )

    return NextResponse.json({ models })
  } catch {
    return NextResponse.json(
      { error: "Failed to reach Hugging Face API" },
      { status: 502 }
    )
  }
}
