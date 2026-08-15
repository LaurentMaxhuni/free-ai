import { PROVIDERS, type ProviderId } from "../providers"

export class ModelValidationError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = "ModelValidationError"
    this.status = status
  }
}

type CachedModelList = { expiresAt: number; models: Set<string> }
const cache = new Map<string, CachedModelList>()
const CACHE_TTL_MS = 5 * 60 * 1000

async function fetchModelIds(
  provider: ProviderId,
  apiKey: string
): Promise<Set<string>> {
  const cached = cache.get(provider)
  if (cached && cached.expiresAt > Date.now()) return cached.models

  const endpoint = provider === "groq"
    ? "https://api.groq.com/openai/v1/models"
    : "https://openrouter.ai/api/v1/models"
  const response = await fetch(endpoint, {
    headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
  })
  if (!response.ok) {
    throw new ModelValidationError(
      `Could not validate the ${PROVIDERS[provider].name} model (${response.status}).`,
      502
    )
  }

  const data = await response.json().catch(() => ({})) as {
    data?: Array<{ id?: string; pricing?: { prompt?: string; completion?: string } }>
  }
  const ids = new Set(
    (Array.isArray(data.data) ? data.data : [])
      .filter((model) => typeof model.id === "string")
      .filter((model) => provider !== "openrouter" || model.id?.endsWith(":free"))
      .map((model) => model.id as string)
  )
  cache.set(provider, { expiresAt: Date.now() + CACHE_TTL_MS, models: ids })
  return ids
}

export async function validateChatModel(
  providerId: ProviderId,
  model: string,
  apiKey: string
): Promise<void> {
  const provider = PROVIDERS[providerId]
  if (provider.textModels.some((option) => option.id === model)) return

  if (providerId === "ollama") {
    throw new ModelValidationError(
      "Ollama requests are sent directly from your browser so localhost refers to your computer.",
      400
    )
  }

  if (providerId !== "groq" && providerId !== "openrouter") {
    throw new ModelValidationError(
      `Model \"${model}\" is not available for ${provider.name}.`,
      400
    )
  }

  let ids: Set<string>
  try {
    ids = await fetchModelIds(providerId, apiKey)
  } catch (error) {
    if (error instanceof ModelValidationError) throw error
    throw new ModelValidationError(`Could not validate the ${provider.name} model.`, 502)
  }
  if (!ids.has(model)) {
    throw new ModelValidationError(
      `Model \"${model}\" is not available for ${provider.name}.`,
      400
    )
  }
}
