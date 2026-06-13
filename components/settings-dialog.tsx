"use client"

import { useEffect, useState, useCallback } from "react"
import { useTheme } from "next-themes"
import { Settings as SettingsIcon, KeyRound, Cpu, Sun, Moon, Eye, EyeOff, ExternalLink, Trash2, Check, RotateCcw, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getSettings, saveSettings, type Settings } from "@/lib/settings"
import { PROVIDERS, PROVIDER_LIST, type ProviderId, type ModelOption } from "@/lib/providers"
import {
  clearProviderKey,
  listConfiguredKeys,
  setProviderKey,
  type ConfiguredProvider,
} from "@/lib/keys-api"
import { fetchOllamaModels } from "@/lib/ollama-models"
import { fetchOpenRouterFreeModels } from "@/lib/openrouter-models"
import { fetchGroqModels } from "@/lib/groq-models"
import { fetchHuggingFaceModels } from "@/lib/huggingface-models"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

type ModelLoadState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; models: ModelOption[] }
  | { kind: "error"; message: string }

function ModelsTab({ configured }: { configured: ConfiguredProvider[] | null }) {
  const [settings, setSettings] = useState<Settings>(() => getSettings())
  const provider = PROVIDERS[settings.provider]
  const isTextCapable = provider.capabilities.includes("text")
  const isImageCapable = provider.capabilities.includes("image")

  const configuredForProvider = configured?.find((c) => c.provider === settings.provider) ?? null
  const isDynamicText = Boolean(provider.dynamicModels)
  const isDynamicImage = Boolean(provider.dynamicImageModels)

  const [textModels, setTextModels] = useState<ModelOption[] | null>(
    isDynamicText ? null : provider.textModels
  )
  const [textState, setTextState] = useState<ModelLoadState>({ kind: "idle" })

  const [imageModels, setImageModels] = useState<ModelOption[] | null>(
    isDynamicImage ? null : provider.imageModels
  )
  const [imageState, setImageState] = useState<ModelLoadState>({ kind: "idle" })

  const loadDynamic = useCallback(
    async (force = false) => {
      if (!provider.dynamicModels) return
      setTextState({ kind: "loading" })
      setTextModels(null)
      try {
        if (provider.dynamicModels.kind === "ollama") {
          const baseUrl = configuredForProvider?.baseUrl ?? provider.baseUrl
          const models = await fetchOllamaModels(baseUrl, force)
          setTextModels(models)
          setTextState({ kind: "ready", models })
        } else if (provider.dynamicModels.kind === "openrouter-free") {
          const models = await fetchOpenRouterFreeModels({ force })
          setTextModels(models)
          setTextState({ kind: "ready", models })
        } else if (provider.dynamicModels.kind === "groq") {
          const models = await fetchGroqModels({ force })
          setTextModels(models)
          setTextState({ kind: "ready", models })
        } else {
          setTextModels(provider.textModels)
          setTextState({ kind: "ready", models: provider.textModels })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load models"
        setTextState({ kind: "error", message })
      }
    },
    [provider, configuredForProvider]
  )

  const loadDynamicImageModels = useCallback(
    async (force = false) => {
      if (!provider.dynamicImageModels) return
      setImageState({ kind: "loading" })
      setImageModels(null)
      try {
        if (provider.dynamicImageModels.kind === "huggingface") {
          const models = await fetchHuggingFaceModels({ force })
          setImageModels(models)
          setImageState({ kind: "ready", models })
        } else {
          setImageModels(provider.imageModels)
          setImageState({ kind: "ready", models: provider.imageModels })
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load image models"
        setImageState({ kind: "error", message })
      }
    },
    [provider]
  )

  // Initial load + reload when provider changes (only for dynamic providers)
  useEffect(() => {
    if (isDynamicText) {
      void loadDynamic(false)
    } else {
      setTextModels(provider.textModels)
      setTextState({ kind: "ready", models: provider.textModels })
    }
  }, [settings.provider, isDynamicText, loadDynamic, provider])

  useEffect(() => {
    if (isDynamicImage) {
      void loadDynamicImageModels(false)
    } else {
      setImageModels(provider.imageModels)
      setImageState({ kind: "ready", models: provider.imageModels })
    }
  }, [settings.provider, isDynamicImage, loadDynamicImageModels, provider])

  const setField = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const next = { ...settings, [key]: value }
    setSettings(next)
    saveSettings(next)
  }

  const onProviderChange = (id: ProviderId) => {
    const p = PROVIDERS[id]
    const next: Settings = {
      ...settings,
      provider: id,
      textModel: p.textModels[0]?.id ?? settings.textModel,
      imageModel: p.imageModels[0]?.id ?? settings.imageModel,
    }
    setSettings(next)
    saveSettings(next)
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="provider">Provider</Label>
        <Select
          value={settings.provider}
          onValueChange={(value) => {
            if (value) onProviderChange(value as ProviderId)
          }}
        >
          <SelectTrigger id="provider" variant="form">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PROVIDER_LIST.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">{provider.description}</p>
      </div>

      {isTextCapable ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="text-model">Text model</Label>
            {isDynamicText ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => loadDynamic(true)}
                disabled={textState.kind === "loading"}
                className="h-6 px-2 text-xs"
              >
                {textState.kind === "loading" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RotateCcw className="size-3" />
                )}
                Refresh
              </Button>
            ) : null}
          </div>
          {isDynamicText && textState.kind === "error" ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <p>{textState.message}</p>
              {provider.dynamicModels?.kind === "ollama" ? (
                <p className="mt-1 text-muted-foreground">
                  Check the Ollama URL in <span className="font-medium">API Keys</span>.
                </p>
              ) : provider.dynamicModels?.kind === "groq" ? (
                <p className="mt-1 text-muted-foreground">
                  Make sure your Groq API key is set in <span className="font-medium">API Keys</span>.
                </p>
              ) : null}
            </div>
          ) : null}
          <Select
            value={settings.textModel}
            onValueChange={(value) => {
              if (value) setField("textModel", value)
            }}
            disabled={!textModels || textModels.length === 0}
          >
            <SelectTrigger id="text-model" variant="form">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {textModels?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDynamicText ? (
            <p className="text-xs text-muted-foreground">
              {provider.dynamicModels?.kind === "ollama"
                ? "Pulled live from your local Ollama instance."
                : "Fetched from the provider's public catalog."}
            </p>
          ) : null}
        </div>
      ) : null}

      {isImageCapable ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="image-model">Image model</Label>
            {isDynamicImage ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => loadDynamicImageModels(true)}
                disabled={imageState.kind === "loading"}
                className="h-6 px-2 text-xs"
              >
                {imageState.kind === "loading" ? (
                  <Loader2 className="size-3 animate-spin" />
                ) : (
                  <RotateCcw className="size-3" />
                )}
                Refresh
              </Button>
            ) : null}
          </div>
          {isDynamicImage && imageState.kind === "error" ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
              <p>{imageState.message}</p>
            </div>
          ) : null}
          <Select
            value={settings.imageModel}
            onValueChange={(value) => {
              if (value) setField("imageModel", value)
            }}
            disabled={!imageModels || imageModels.length === 0}
          >
            <SelectTrigger id="image-model" variant="form">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {imageModels?.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isDynamicImage ? (
            <p className="text-xs text-muted-foreground">
              Pulled from the Hugging Face model catalog.
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2 pt-2 border-t">
        <h4 className="text-sm font-medium">Quick selector providers</h4>
        <p className="text-xs text-muted-foreground">
          Choose which providers appear in the chat input model dropdown.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {PROVIDER_LIST.map((p) => (
            <label
              key={p.id}
              className="flex items-center gap-2 text-xs cursor-pointer hover:bg-muted/50 rounded px-2 py-1.5 transition-colors"
            >
              <input
                type="checkbox"
                checked={settings.visibleProviders?.includes(p.id as ProviderId) ?? true}
                onChange={(e) => {
                  const current = settings.visibleProviders ?? PROVIDER_LIST.map((x) => x.id)
                  const next = e.target.checked
                    ? [...current, p.id]
                    : current.filter((id) => id !== p.id)
                  saveSettings({ visibleProviders: next })
                  setSettings((prev) => ({ ...prev, visibleProviders: next }))
                }}
                className="accent-foreground"
              />
              <span>{p.name}</span>
            </label>
          ))}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Add API keys in the <span className="font-medium">API Keys</span> tab.
      </p>
    </div>
  )
}

function ProviderKeyCard({
  configured,
  onChange,
}: {
  configured: ConfiguredProvider
  onChange: () => void
}) {
  const provider = PROVIDERS[configured.provider]
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const canBaseUrl = provider.id === "ollama" || provider.id === "pollinations"

  const onSave = async () => {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await setProviderKey(configured.provider, {
        ...(apiKey ? { apiKey } : {}),
        ...(baseUrl ? { baseUrl } : {}),
      })
      setApiKey("")
      setBaseUrl("")
      setSaved(true)
      onChange()
      window.setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save key")
    } finally {
      setBusy(false)
    }
  }

  const onClear = async () => {
    setClearConfirmOpen(true)
  }

  const confirmClear = async () => {
    setClearConfirmOpen(false)
    setBusy(true)
    setError(null)
    try {
      await clearProviderKey(configured.provider)
      onChange()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to clear key")
    } finally {
      setBusy(false)
    }
  }

  const hasKey = configured.hasApiKey
  const hasUrl = Boolean(configured.baseUrl)

  return (
    <div className="rounded-3xl border p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">{provider.name}</p>
          <p className="text-xs text-muted-foreground">{provider.description}</p>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          {hasKey ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5">
              <Check className="size-3" /> Key set
            </span>
          ) : provider.requiresKey ? (
            <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5">
              No key
            </span>
          ) : null}
          {hasUrl ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground">
              URL overridden
            </span>
          ) : null}
        </div>
      </div>

      {provider.requiresKey ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`key-${provider.id}`}>API key</Label>
            {provider.keyHelpUrl ? (
              <a
                href={provider.keyHelpUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
              >
                Get a key <ExternalLink className="size-3" />
              </a>
            ) : null}
          </div>
          <div className="relative">
            <Input
              id={`key-${provider.id}`}
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder={hasKey ? "•••••••• (leave blank to keep)" : provider.keyPlaceholder ?? "Paste your key"}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
            />
            <button
              type="button"
              onClick={() => setShowKey((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
              aria-label={showKey ? "Hide key" : "Show key"}
            >
              {showKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </div>
      ) : null}

      {canBaseUrl ? (
        <div className="space-y-1.5">
          <Label htmlFor={`url-${provider.id}`}>
            {provider.id === "ollama" ? "Ollama base URL" : "Base URL (override)"}
          </Label>
          <Input
            id={`url-${provider.id}`}
            type="url"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder={
              hasUrl
                ? "•••••••• (leave blank to keep)"
                : provider.baseUrl
            }
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </div>
      ) : null}

      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex items-center justify-end gap-2">
        {hasKey || hasUrl ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClear}
            disabled={busy}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="size-4" />
            Clear
          </Button>
        ) : null}
        <Button
          type="button"
          size="sm"
          onClick={onSave}
          disabled={busy || (!apiKey && !baseUrl)}
        >
          {saved ? "Saved" : "Save"}
        </Button>
      </div>

      <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear API key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove the stored API key and base URL for {provider.name}. You&apos;ll need to enter them again to use this provider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={() => setClearConfirmOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">
              Clear
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AppearanceTab() {
  const { theme, setTheme } = useTheme()

  const options = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: RotateCcw },
  ] as const

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Choose how Free.ai looks.
      </p>
      <div className="grid gap-2">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border text-sm transition-colors cursor-pointer ${
              theme === value
                ? "border-foreground bg-accent text-accent-foreground"
                : "border-border hover:bg-muted/50 text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon className="size-4 shrink-0" />
            <span className="font-medium">{label}</span>
            {theme === value && (
              <Check className="size-3.5 ml-auto shrink-0" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}

function ApiKeysTab({
  configured,
  reload,
}: {
  configured: ConfiguredProvider[] | null
  reload: () => void
}) {
  const [activeProvider, setActiveProvider] = useState<ProviderId>("groq")

  if (!configured) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Keys are stored encrypted in Firebase, scoped to your account. The browser never holds them after saving.
      </p>
      <Tabs value={activeProvider} onValueChange={(v) => v && setActiveProvider(v as ProviderId)}>
        <TabsList className="w-full justify-start h-auto flex-wrap">
          {configured.map((c) => {
            const p = PROVIDERS[c.provider]
            return (
              <TabsTrigger key={c.provider} value={c.provider} className="text-xs">
                {p.name}
              </TabsTrigger>
            )
          })}
        </TabsList>
        {configured.map((c) => (
          <TabsContent key={c.provider} value={c.provider}>
            <ProviderKeyCard configured={c} onChange={reload} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

export function SettingsDialog() {
  const [open, setOpen] = useState(false)
  const [configured, setConfigured] = useState<ConfiguredProvider[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = async () => {
    setError(null)
    try {
      const list = await listConfiguredKeys()
      setConfigured(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load keys")
      setConfigured([])
    }
  }

  useEffect(() => {
    if (!open) return
    // One-shot fetch when the dialog opens; reload() owns the loading/error state.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void reload()
  }, [open])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Settings"
            className="cursor-pointer"
          />
        }
      >
        <SettingsIcon className="size-4" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Choose a provider and model, then add your API keys.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : (
          <Tabs defaultValue="models">
            <TabsList>
              <TabsTrigger value="models">
                <Cpu className="size-3.5 mr-1.5" />
                Models
              </TabsTrigger>
              <TabsTrigger value="appearance">
                <Sun className="size-3.5 mr-1.5" />
                Appearance
              </TabsTrigger>
              <TabsTrigger value="keys">
                <KeyRound className="size-3.5 mr-1.5" />
                API Keys
              </TabsTrigger>
            </TabsList>
            <TabsContent value="models">
              <ModelsTab configured={configured} />
            </TabsContent>
            <TabsContent value="appearance">
              <AppearanceTab />
            </TabsContent>
            <TabsContent value="keys">
              <ApiKeysTab configured={configured} reload={reload} />
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  )
}
