export type ProviderId =
  | "pollinations"
  | "puter"
  | "ollama"
  | "groq"
  | "openrouter"
  | "huggingface"

export type ModelOption = {
  id: string
  label: string
}

export type DynamicModelSource =
  | { kind: "ollama" }
  | { kind: "openrouter-free" }

export type Provider = {
  id: ProviderId
  name: string
  description: string
  capabilities: ("text" | "image")[]
  baseUrl: string
  /**
   * Path appended to `baseUrl` for text completions. Defaults to
   * `/chat/completions` (OpenAI-compatible). Providers with a different
   * shape (Puter) override this.
   */
  chatPath?: string
  requiresKey: boolean
  keyPlaceholder?: string
  keyHelpUrl?: string
  textModels: ModelOption[]
  imageModels: ModelOption[]
  /**
   * If set, the client fetches the model list at runtime instead of using the
   * static arrays above. `kind` tells the UI which fetcher to call.
   */
  dynamicModels?: DynamicModelSource
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  pollinations: {
    id: "pollinations",
    name: "Pollinations.ai",
    description: "Free, no API key. Default for getting started.",
    capabilities: ["text", "image"],
    baseUrl: "https://gen.pollinations.ai",
    chatPath: "/v1/chat/completions",
    requiresKey: false,
    textModels: [{ id: "openai", label: "OpenAI" }],
    imageModels: [{ id: "flux", label: "Flux" }],
  },

  puter: {
    id: "puter",
    name: "Puter",
    description:
      "Free AI — get your auth token from puter.com/dashboard.",
    capabilities: ["text"],
    baseUrl: "https://api.puter.com/puterai/openai/v1",
    requiresKey: true,
    keyPlaceholder: "Paste your Puter auth token",
    keyHelpUrl: "https://puter.com/dashboard",
    textModels: [
      { id: "gpt-5-nano", label: "GPT-5 Nano" },
      { id: "gpt-4o-mini", label: "GPT-4o Mini" },
      { id: "claude-sonnet-4-5", label: "Claude Sonnet 4.5" },
      { id: "claude-3-5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite" },
      { id: "deepseek-chat", label: "DeepSeek Chat" },
    ],
    imageModels: [],
  },

  ollama: {
    id: "ollama",
    name: "Ollama",
    description:
      "Local models. Run `OLLAMA_ORIGINS=* ollama serve` for browser access.",
    capabilities: ["text"],
    baseUrl: "http://localhost:11434",
    requiresKey: false,
    keyHelpUrl: "https://ollama.com",
    textModels: [],
    imageModels: [],
    dynamicModels: { kind: "ollama" },
  },

  groq: {
    id: "groq",
    name: "Groq",
    description: "Ultra-fast inference. Free tier at console.groq.com.",
    capabilities: ["text"],
    baseUrl: "https://api.groq.com/openai/v1",
    requiresKey: true,
    keyPlaceholder: "gsk_...",
    keyHelpUrl: "https://console.groq.com/keys",
    textModels: [
      { id: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { id: "llama-3.1-8b-instant", label: "Llama 3.1 8B (fastest)" },
      { id: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
    imageModels: [],
  },

  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    description: "One API, many models. Free tiers available.",
    capabilities: ["text"],
    baseUrl: "https://openrouter.ai/api/v1",
    requiresKey: true,
    keyPlaceholder: "sk-or-v1-...",
    keyHelpUrl: "https://openrouter.ai/keys",
    textModels: [],
    imageModels: [],
    dynamicModels: { kind: "openrouter-free" },
  },

  huggingface: {
    id: "huggingface",
    name: "Hugging Face",
    description:
      "Image generation via the Inference API. Free tier with rate limits.",
    capabilities: ["image"],
    baseUrl: "https://api-inference.huggingface.co",
    requiresKey: true,
    keyPlaceholder: "hf_...",
    keyHelpUrl: "https://huggingface.co/settings/tokens",
    textModels: [],
    imageModels: [
      { id: "black-forest-labs/FLUX.1-schnell", label: "FLUX.1 Schnell (fast)" },
      { id: "stabilityai/stable-diffusion-xl-base-1.0", label: "SDXL" },
      { id: "runwayml/stable-diffusion-v1-5", label: "SD 1.5" },
    ],
  },
}

export const PROVIDER_LIST: Provider[] = Object.values(PROVIDERS)
