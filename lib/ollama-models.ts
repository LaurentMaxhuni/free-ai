import type { ModelOption } from "./providers"

export class OllamaFetchError extends Error {
  status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = "OllamaFetchError"
    this.status = status
  }
}

export async function fetchOllamaModels(
  baseUrl: string,
  force?: boolean
): Promise<ModelOption[]> {
  const cleanBase = baseUrl.replace(/\/+$/, "")
  const url = force ? `${cleanBase}/api/tags?ts=${Date.now()}` : `${cleanBase}/api/tags`
  let response: Response
  try {
    response = await fetch(url, { method: "GET" })
  } catch {
    throw new OllamaFetchError(
      `Could not reach Ollama at ${cleanBase}. Is it running with CORS enabled? (OLLAMA_ORIGINS=*)`
    )
  }
  if (!response.ok) {
    throw new OllamaFetchError(
      `Ollama responded with ${response.status}.`,
      response.status
    )
  }
  const data = (await response.json().catch(() => ({}))) as {
    models?: Array<{ name?: string }>
  }
  const raw = Array.isArray(data.models) ? data.models : []
  return raw
    .filter((m): m is { name: string } => typeof m?.name === "string")
    .map<ModelOption>((m) => ({
      id: m.name,
      label: prettifyOllamaName(m.name),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

function prettifyOllamaName(name: string): string {
  const [base, tag] = name.split(":")
  if (!tag || tag === "latest") return base
  return `${base} (${tag})`
}
