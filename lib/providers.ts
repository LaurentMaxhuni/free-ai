export type ProviderId =
  | "freeai"
  | "pollinations"
  | "puter"
  | "ollama"
  | "groq"
  | "openrouter"
  | "huggingface"

export type ModelOption = {
  id: string
  label: string
  supportsWebSearch?: boolean
}

export type DynamicModelSource =
  | { kind: "ollama" }
  | { kind: "openrouter-free" }
  | { kind: "groq" }
  | { kind: "huggingface" }

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
   * If set, the client fetches text models at runtime instead of using the
   * static arrays above. `kind` tells the UI which fetcher to call.
   */
  dynamicModels?: DynamicModelSource
  /**
   * Same as `dynamicModels` but for image models.
   */
  dynamicImageModels?: DynamicModelSource
}

export const PROVIDERS: Record<ProviderId, Provider> = {
  freeai: {
    id: "freeai",
    name: "Free.ai",
    description:
      "Built-in model powered by Cloudflare Workers AI. Always available, no setup needed.",
    capabilities: ["text", "image"],
    baseUrl: "https://api.cloudflare.com/client/v4/accounts",
    requiresKey: false,
    textModels: [
      { id: "@cf/meta/llama-3.2-3b-instruct", label: "Llama 3.2 3B" },
      { id: "@cf/meta/llama-3.1-8b-instruct", label: "Llama 3.1 8B" },
      { id: "@cf/mistral/mistral-7b-instruct-v0.1", label: "Mistral 7B" },
      { id: "@cf/google/gemma-2-9b-it", label: "Gemma 2 9B" },
    ],
    imageModels: [
      { id: "@cf/black-forest-labs/flux-1-schnell", label: "Flux Schnell" },
      { id: "@cf/stabilityai/stable-diffusion-xl-base-1.0", label: "SDXL Base" },
      { id: "@cf/bytedance/stable-diffusion-xl-lightning", label: "SDXL Lightning" },
    ],
  },

  pollinations: {
    id: "pollinations",
    name: "Pollinations.ai",
    description: "Free AI text & image generation. Works without an API key.",
    capabilities: ["text", "image"],
    baseUrl: "https://gen.pollinations.ai",
    chatPath: "/v1/chat/completions",
    requiresKey: false,
    keyPlaceholder: "Optional Pollinations API key",
    keyHelpUrl: "https://pollinations.ai",
    textModels: [
      { id: "openai", label: "OpenAI" },
      { id: "openai-large", label: "OpenAI Large" },
      { id: "mistral", label: "Mistral" },
      { id: "llama", label: "Llama" },
      { id: "deepseek", label: "DeepSeek" },
    ],
    imageModels: [
      { id: "flux", label: "Flux" },
      { id: "flux-realism", label: "Flux Realism" },
      { id: "flux-anime", label: "Flux Anime" },
      { id: "flux-3d", label: "Flux 3D" },
      { id: "any-dark", label: "Any Dark" },
    ],
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
    textModels: [],
    imageModels: [],
    dynamicModels: { kind: "groq" },
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
    imageModels: [],
    dynamicImageModels: { kind: "huggingface" },
  },
}

export const PROVIDER_LIST: Provider[] = Object.values(PROVIDERS)
