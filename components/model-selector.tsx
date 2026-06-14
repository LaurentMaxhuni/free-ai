"use client"

import { useEffect, useRef, useState } from "react"
import { Check, ChevronDown, Loader2 } from "lucide-react"
import { getSettings, saveSettings } from "@/lib/settings"
import { PROVIDERS, type ProviderId, type ModelOption } from "@/lib/providers"
import { cn } from "@/lib/utils"
import type { ChatMode } from "@/lib/ai"

export function ModelSelector({ mode }: { mode: ChatMode }) {
  const [open, setOpen] = useState(false)
  const [dynamicModels, setDynamicModels] = useState<Record<string, ModelOption[]>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})
  const settings = getSettings()
  const currentModelId = mode === "text" ? settings.textModel : settings.imageModel
  const dropdownRef = useRef<HTMLDivElement>(null)

  const visibleProviderIds = settings.visibleProviders ?? Object.keys(PROVIDERS)

  const providerGroups = visibleProviderIds
    .map((id) => PROVIDERS[id as ProviderId])
    .filter(Boolean)
    .filter((p) => p.capabilities.includes(mode))
    .filter((p) =>
      mode === "text"
        ? p.textModels.length > 0 || p.dynamicModels
        : p.imageModels.length > 0 || p.dynamicImageModels
    )
    .sort((a, b) => {
      if (a.id === "freeai") return -1
      if (b.id === "freeai") return 1
      return 0
    })

  useEffect(() => {
    providerGroups.forEach(async (p) => {
      const needsDynamic =
        mode === "text" ? p.dynamicModels : p.dynamicImageModels
      if (!needsDynamic) return
      const key = `${p.id}-${mode}`
      if (dynamicModels[key]) return
      setLoading((prev) => ({ ...prev, [key]: true }))
      try {
        let models: ModelOption[] = []
        if (needsDynamic.kind === "ollama") {
          const { fetchOllamaModels } = await import("@/lib/ollama-models")
          models = await fetchOllamaModels(p.baseUrl)
        } else if (needsDynamic.kind === "groq") {
          const { fetchGroqModels } = await import("@/lib/groq-models")
          models = await fetchGroqModels()
        } else if (needsDynamic.kind === "openrouter-free") {
          const { fetchOpenRouterFreeModels } = await import("@/lib/openrouter-models")
          models = await fetchOpenRouterFreeModels()
        } else if (needsDynamic.kind === "huggingface") {
          const { fetchHuggingFaceModels } = await import("@/lib/huggingface-models")
          models = await fetchHuggingFaceModels()
        }
        setDynamicModels((prev) => ({ ...prev, [key]: models }))
      } catch {
        /* dynamic fetch failure is non-fatal */
      } finally {
        setLoading((prev) => ({ ...prev, [key]: false }))
      }
    })
  }, [mode])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler, true)
    return () => document.removeEventListener("mousedown", handler, true)
  }, [open])

  const allModels = providerGroups.flatMap((p) => {
    const key = `${p.id}-${mode}`
    if (mode === "text") {
      return p.textModels.length ? p.textModels : dynamicModels[key] ?? []
    }
    return p.imageModels.length ? p.imageModels : dynamicModels[key] ?? []
  })

  const currentLabel = allModels.find((m) => m.id === currentModelId)?.label ?? currentModelId

  const selectModel = (modelId: string) => {
    if (mode === "text") saveSettings({ textModel: modelId })
    else saveSettings({ imageModel: modelId })
    setOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
        aria-label="Select model"
      >
        <span className="max-w-[100px] truncate">{currentLabel}</span>
        <ChevronDown className="size-3 shrink-0" />
      </button>
      {open && (
        <div className="absolute bottom-full mb-1 left-0 z-50 w-56 rounded-lg border bg-popover p-1 shadow-md max-h-64 overflow-y-auto">
          {providerGroups.map((p) => {
            const key = `${p.id}-${mode}`
            const models =
              mode === "text"
                ? p.textModels.length
                  ? p.textModels
                  : dynamicModels[key] ?? []
                : p.imageModels.length
                  ? p.imageModels
                  : dynamicModels[key] ?? []
            const isLoading = loading[key]

            if (models.length === 0 && !isLoading) return null

            return (
              <div key={p.id}>
                <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                  {p.name}
                </div>
                {isLoading ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Loader2 className="size-3 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  models.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => selectModel(m.id)}
                      className={cn(
                        "flex w-full items-center gap-2 px-2 py-1.5 text-xs rounded-md transition-colors cursor-pointer",
                        m.id === currentModelId
                          ? "bg-accent text-accent-foreground"
                          : "text-popover-foreground hover:bg-accent/50"
                      )}
                    >
                      <span className="flex-1 text-left truncate">{m.label}</span>
                      {m.id === currentModelId && <Check className="size-3 shrink-0" />}
                    </button>
                  ))
                )}
              </div>
            )
          })}
          {providerGroups.length === 0 && (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">
              No models available
            </div>
          )}
        </div>
      )}
    </div>
  )
}
