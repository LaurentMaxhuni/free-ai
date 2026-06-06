import type { ModelOption } from "./providers"

const CACHE_KEY = "free-ai:openrouter-free-models"
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hour
const ENDPOINT = "https://openrouter.ai/api/v1/models"

type Cached = { fetchedAt: number; models: ModelOption[] }

export class OpenRouterFetchError extends Error {
  status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = "OpenRouterFetchError"
    this.status = status
  }
}

export async function fetchOpenRouterFreeModels(
  opts: { force?: boolean } = {}
): Promise<ModelOption[]> {
  if (!opts.force) {
    const cached = readCache()
    if (cached) return cached
  }
  let response: Response
  try {
    response = await fetch(ENDPOINT, { method: "GET" })
  } catch {
    throw new OpenRouterFetchError(
      "Could not reach openrouter.ai. Check your network and try again."
    )
  }
  if (!response.ok) {
    throw new OpenRouterFetchError(
      `OpenRouter responded with ${response.status}.`,
      response.status
    )
  }
  const data = (await response.json().catch(() => ({}))) as {
    data?: Array<{ id?: string; name?: string }>
  }
  const raw = Array.isArray(data.data) ? data.data : []
  const free = raw
    .filter((m): m is { id: string; name?: string } => typeof m?.id === "string" && m.id.endsWith(":free"))
    .map<ModelOption>((m) => ({
      id: m.id,
      label: prettifyOpenRouterName(m.name ?? m.id, m.id),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))
  writeCache({ fetchedAt: Date.now(), models: free })
  return free
}

function prettifyOpenRouterName(name: string, id: string): string {
  const cleaned = name.replace(/\s*\(free\)\s*$/i, "").trim()
  if (cleaned && cleaned.toLowerCase() !== id.toLowerCase()) {
    return `${cleaned} (free)`
  }
  return `${id} (free)`
}

function readCache(): ModelOption[] | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Cached
    if (!parsed || !Array.isArray(parsed.models)) return null
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null
    return parsed.models
  } catch {
    return null
  }
}

function writeCache(value: Cached): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(value))
  } catch {
    /* quota or disabled */
  }
}

export function clearOpenRouterCache(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}
