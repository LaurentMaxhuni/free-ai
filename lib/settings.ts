import type { ProviderId } from "./providers"

const SETTINGS_KEY = "free-ai:settings"

export type Settings = {
  provider: ProviderId
  textModel: string
  imageModel: string
  visibleProviders: ProviderId[]
}

const ALL_PROVIDERS: ProviderId[] = [
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
  visibleProviders: [...ALL_PROVIDERS],
}

export function getSettings(): Settings {
  if (typeof window === "undefined") return DEFAULTS
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Settings>
    return { ...DEFAULTS, ...parsed }
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
