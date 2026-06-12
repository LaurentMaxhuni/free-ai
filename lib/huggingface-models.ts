import type { ModelOption } from "./providers"

const CACHE_KEY = "free-ai:huggingface-models"
const CACHE_TTL_MS = 60 * 60 * 1000

type Cached = { fetchedAt: number; models: ModelOption[] }

export class HuggingFaceFetchError extends Error {
  status: number | null
  constructor(message: string, status: number | null = null) {
    super(message)
    this.name = "HuggingFaceFetchError"
    this.status = status
  }
}

export async function fetchHuggingFaceModels(
  opts: { force?: boolean } = {}
): Promise<ModelOption[]> {
  if (!opts.force) {
    const cached = readCache()
    if (cached) return cached
  }

  let response: Response
  try {
    response = await fetch("/api/models/huggingface", { method: "GET" })
  } catch {
    throw new HuggingFaceFetchError(
      "Could not reach the model list endpoint. Check your network."
    )
  }

  if (response.status === 401) {
    throw new HuggingFaceFetchError(
      "You must be signed in to fetch Hugging Face models."
    )
  }

  if (!response.ok) {
    throw new HuggingFaceFetchError(
      `Failed to fetch Hugging Face models (${response.status}).`,
      response.status
    )
  }

  const data = (await response.json().catch(() => ({}))) as {
    models?: ModelOption[]
  }
  const models = Array.isArray(data.models) ? data.models : []
  writeCache({ fetchedAt: Date.now(), models })
  return models
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

export function clearHuggingFaceCache(): void {
  if (typeof window === "undefined") return
  try {
    window.localStorage.removeItem(CACHE_KEY)
  } catch {
    /* ignore */
  }
}
