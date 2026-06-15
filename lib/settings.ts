import type { ProviderId } from "./providers"

const SETTINGS_KEY = "free-ai:settings"

export type Settings = {
  provider: ProviderId
  textModel: string
  imageModel: string
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
  provider: "freeai",
  textModel: "@cf/meta/llama-3.2-3b-instruct",
  imageModel: "@cf/black-forest-labs/flux-1-schnell",
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
