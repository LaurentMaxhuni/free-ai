import type { ProviderId } from "./providers"

const SETTINGS_KEY = "free-ai:settings"

export type Settings = {
  provider: ProviderId
  textModel: string
  imageModel: string
  ollamaBaseUrl: string
  visibleProviders: ProviderId[]
  autoSync: boolean
  colorTheme: string
}

const ALL_PROVIDERS: ProviderId[] = [
  "freeai",
  "pollinations",
  "puter",
  "ollama",
  "groq",
  "openrouter",
  "huggingface",
]

const DEFAULTS: Settings = {
  provider: "pollinations",
  textModel: "openai",
  imageModel: "flux",
  ollamaBaseUrl: "http://localhost:11434",
  visibleProviders: [...ALL_PROVIDERS],
  autoSync: true,
  colorTheme: "default",
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Settings>
    const provider = ALL_PROVIDERS.includes(parsed.provider as ProviderId)
      ? (parsed.provider as ProviderId)
      : DEFAULTS.provider
    return {
      ...DEFAULTS,
      ...parsed,
      provider,
      textModel: typeof parsed.textModel === "string" && parsed.textModel.trim()
        ? parsed.textModel.trim()
        : DEFAULTS.textModel,
      imageModel: typeof parsed.imageModel === "string" && parsed.imageModel.trim()
        ? parsed.imageModel.trim()
        : DEFAULTS.imageModel,
      visibleProviders: Array.isArray(parsed.visibleProviders)
        ? parsed.visibleProviders.filter((provider): provider is ProviderId => ALL_PROVIDERS.includes(provider as ProviderId))
        : DEFAULTS.visibleProviders,
      ollamaBaseUrl:
        typeof parsed.ollamaBaseUrl === "string" && parsed.ollamaBaseUrl.trim()
          ? parsed.ollamaBaseUrl.trim()
          : DEFAULTS.ollamaBaseUrl,
    }
  } catch {
    return DEFAULTS
  }
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const next = { ...getSettings(), ...patch }
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
    } catch {
      /* quota or disabled */
    }
  }
  return next
}
