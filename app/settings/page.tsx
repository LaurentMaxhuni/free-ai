"use client"

import { useCallback, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTheme } from "@/components/theme-provider"
import { ArrowLeft, LogOut, Cpu, RefreshCw, Sun, Moon, KeyRound, Eye, EyeOff, ExternalLink, Trash2, Check, RotateCcw, Loader2, Palette } from "lucide-react"
import { ThemeScope } from "@/components/theme-scope"
import { useThemeColor } from "@/components/color-theme-provider"
import { onAuthStateChanged, signOut } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollableTabs, type Tab } from "@/components/shadcn-studio/tabs/tabs-29"
import { getSettings, saveSettings, type Settings } from "@/lib/settings"
import { PROVIDERS, PROVIDER_LIST, type ProviderId } from "@/lib/providers"
import {
  clearProviderKey,
  listConfiguredKeys,
  setProviderKey,
  type ConfiguredProvider,
} from "@/lib/keys-api"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

const NAV_ITEMS = [
  { id: "providers", label: "Providers", icon: Cpu },
  { id: "sync", label: "Sync", icon: RefreshCw },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "keys", label: "API Keys", icon: KeyRound },
] as const

type SectionId = (typeof NAV_ITEMS)[number]["id"]

function ProvidersSection() {
  const [settings, setSettings] = useState<Settings>(() => getSettings())
  const visible = settings.visibleProviders ?? PROVIDER_LIST.map((x) => x.id)
  const toggle = (id: ProviderId) => {
    const next = visible.includes(id) ? visible.filter((v) => v !== id) : [...visible, id]
    saveSettings({ visibleProviders: next })
    setSettings((prev) => ({ ...prev, visibleProviders: next }))
  }

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Choose which providers appear in the chat input model dropdown.
      </p>
      <div className="flex flex-wrap gap-2">
        {PROVIDER_LIST.map((p) => {
          const active = visible.includes(p.id as ProviderId)
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
className={`inline-flex h-7 items-center rounded-md px-3 text-sm font-medium transition-all cursor-pointer ${
                 active
                   ? "bg-background text-foreground shadow-sm border"
                   : "bg-muted text-muted-foreground hover:text-foreground border border-transparent"
               }`}
            >
              {p.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function SyncSection() {
  const [settings, setSettings] = useState<Settings>(() => getSettings())
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<"idle" | "done" | "error">("idle")
  const [deleting, setDeleting] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [deleteResult, setDeleteResult] = useState<"idle" | "done" | "error">("idle")

  const handleManualSync = async () => {
    setSyncing(true)
    setSyncResult("idle")
    try {
      const { syncAllChats } = await import("@/lib/chat-sync")
      await syncAllChats()
      setSyncResult("done")
    } catch {
      setSyncResult("error")
    } finally {
      setSyncing(false)
    }
  }

  const handleDeleteAll = async () => {
    setDeleteConfirmOpen(false)
    setDeleting(true)
    setDeleteResult("idle")
    try {
      const { getAllChats, deleteChat } = await import("@/lib/chat-storage")
      const { removeChat } = await import("@/lib/chat-sync")
      const chats = getAllChats()
      for (const chat of chats) {
        deleteChat(chat.id)
        removeChat(chat.id)
      }
      setDeleteResult("done")
    } catch {
      setDeleteResult("error")
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="auto-sync" className="text-sm">Auto-sync chats</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              {settings.autoSync ? "Chats are automatically saved to your account in real-time." : "Auto-sync is disabled."}
            </p>
          </div>
          <button
            type="button"
            role="switch"
            id="auto-sync"
            aria-checked={settings.autoSync}
            onClick={() => {
              const next = !settings.autoSync
              saveSettings({ autoSync: next })
              setSettings((prev) => ({ ...prev, autoSync: next }))
            }}
            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              settings.autoSync ? "bg-primary" : "bg-muted"
            }`}
          >
            <span className={`pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm ring-0 transition-transform ${settings.autoSync ? "translate-x-4" : "translate-x-0"}`} />
          </button>
        </div>
        <div>
          <Button type="button" variant="outline" size="sm" onClick={handleManualSync} disabled={syncing} className="gap-2">
            {syncing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
            {syncing ? "Syncing..." : "Sync all chats now"}
          </Button>
          {syncResult === "done" && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><Check className="size-3" /> All chats synced successfully.</p>
          )}
          {syncResult === "error" && (
            <p className="text-xs text-destructive mt-1">Sync failed. Make sure you&apos;re signed in and try again.</p>
          )}
        </div>
      </div>

      <hr className="border-border" />

      <div className="space-y-3">
        <div>
          <p className="text-sm font-medium">Delete all chats</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Permanently removes all chats from this device and your account.
          </p>
        </div>
        <div>
          <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteConfirmOpen(true)} disabled={deleting} className="gap-2">
            {deleting ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
            {deleting ? "Deleting..." : "Delete all chats"}
          </Button>
          {deleteResult === "done" && (
            <p className="text-xs text-green-600 flex items-center gap-1 mt-1"><Check className="size-3" /> All chats deleted.</p>
          )}
          {deleteResult === "error" && (
            <p className="text-xs text-destructive mt-1">Failed to delete some chats. Try again.</p>
          )}
        </div>
      </div>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete all chats?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete every chat from this device and your account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={() => setDeleteConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">Delete all</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

const COLOR_THEMES = [
  { id: "default", label: "Default", color: "#349ff8" },
  { id: "claude", label: "Claude", color: "#d97706" },
  { id: "grok", label: "Grok", color: "#a855f7" },
  { id: "monokai", label: "Monokai", color: "#a6e22e" },
  { id: "night-owl", label: "Night Owl", color: "#5f9eff" },
  { id: "dracula", label: "Dracula", color: "#ff79c6" },
]

function AppearanceSection() {
  const { theme, setTheme } = useTheme()
  const { setTheme: setColorTheme } = useThemeColor()
  const [settings, setSettings] = useState<Settings>(() => getSettings())
  const modeOptions = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "system", label: "System", icon: RotateCcw },
  ] as const

  const selectTheme = (id: string) => {
    saveSettings({ colorTheme: id })
    setSettings((prev) => ({ ...prev, colorTheme: id }))
    setColorTheme(id)
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-muted-foreground mb-3">Choose how Free.ai looks.</p>
        <div className="grid gap-2">
          {modeOptions.map(({ value, label, icon: Icon }) => (
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
              {theme === value && <Check className="size-3.5 ml-auto shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs text-muted-foreground mb-3">Color theme</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {COLOR_THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => selectTheme(t.id)}
              className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-lg border text-xs transition-colors cursor-pointer ${
                settings.colorTheme === t.id
                  ? "border-foreground bg-accent"
                  : "border-border hover:bg-muted/50"
              }`}
            >
              <span
                className="size-5 rounded-full ring-1 ring-inset ring-black/10"
                style={{ backgroundColor: t.color }}
              />
              <span className="text-muted-foreground font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ProviderKeyCard({ configured, onChange }: { configured: ConfiguredProvider; onChange: () => void }) {
  const provider = PROVIDERS[configured.provider]
  const [apiKey, setApiKey] = useState("")
  const [baseUrl, setBaseUrl] = useState("")
  const [showKey, setShowKey] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false)

  const canBaseUrl = provider.id === "ollama"

  const onSave = async () => {
    setBusy(true)
    setError(null)
    setSaved(false)
    try {
      await setProviderKey(configured.provider, {
        ...(apiKey ? { apiKey } : {}),
        ...(baseUrl ? { baseUrl } : {}),
      })
      if (configured.provider === "ollama" && baseUrl) {
        saveSettings({ ollamaBaseUrl: baseUrl })
      }
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

  const confirmClear = async () => {
    setClearConfirmOpen(false)
    setBusy(true)
    setError(null)
    try {
      await clearProviderKey(configured.provider)
      if (configured.provider === "ollama") {
        saveSettings({ ollamaBaseUrl: PROVIDERS.ollama.baseUrl })
      }
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
        <div className="flex items-center gap-1.5 text-xs shrink-0">
          {hasKey ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary px-2 py-0.5">
              <Check className="size-3" /> Key set
            </span>
          ) : provider.requiresKey ? (
            <span className="rounded-full bg-destructive/10 text-destructive px-2 py-0.5">No key</span>
          ) : null}
          {hasUrl ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-muted-foreground">URL overridden</span>
          ) : null}
        </div>
      </div>

      {provider.requiresKey ? (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor={`key-${provider.id}`}>API key</Label>
            {provider.keyHelpUrl ? (
              <a href={provider.keyHelpUrl} target="_blank" rel="noreferrer noopener" className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
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
            placeholder={hasUrl ? "•••••••• (leave blank to keep)" : provider.baseUrl}
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </div>
      ) : null}

      {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}

      <div className="flex items-center justify-end gap-2">
        {hasKey || hasUrl ? (
          <Button type="button" variant="ghost" size="sm" onClick={() => setClearConfirmOpen(true)} disabled={busy} className="text-destructive hover:text-destructive">
            <Trash2 className="size-4" /> Clear
          </Button>
        ) : null}
        <Button type="button" size="sm" onClick={onSave} disabled={busy || (!apiKey && !baseUrl)}>
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
            <AlertDialogCancel onClick={() => setClearConfirmOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClear} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">Clear</AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function ApiKeysSection({ configured, reload }: { configured: ConfiguredProvider[] | null; reload: () => void }) {
  const [activeProvider, setActiveProvider] = useState<ProviderId>("groq")

  const tabs: Tab[] = (configured ?? []).map((c) => {
    const provider = PROVIDERS[c.provider]
    let badge: React.ReactNode | undefined
    if (c.hasApiKey) {
      badge = (
        <span className="inline-flex size-1.5 rounded-full bg-emerald-500" />
      )
    } else if (provider.requiresKey) {
      badge = (
        <span className="inline-flex size-1.5 rounded-full bg-destructive" />
      )
    }
    return { value: c.provider, label: provider.name, badge }
  })

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">
        Keys are stored encrypted in Firebase, scoped to your account.
      </p>
      {!configured ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <ScrollableTabs tabs={tabs} value={activeProvider} onValueChange={(v) => v && setActiveProvider(v as ProviderId)}>
          {(providerId) => (
            <ProviderKeyCard
              key={providerId}
              configured={configured.find((c) => c.provider === providerId)!}
              onChange={reload}
            />
          )}
        </ScrollableTabs>
      )}
    </div>
  )
}

const CONTENT: Record<SectionId, (props: { configured: ConfiguredProvider[] | null; reload: () => void }) => React.ReactNode> = {
  providers: () => <ProvidersSection />,
  sync: () => <SyncSection />,
  appearance: () => <AppearanceSection />,
  keys: (props) => <ApiKeysSection configured={props.configured} reload={props.reload} />,
}

export default function SettingsPage() {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [configured, setConfigured] = useState<ConfiguredProvider[] | null>(null)
  const [signingOut, setSigningOut] = useState(false)
  const [activeSection, setActiveSection] = useState<SectionId>("providers")

  const reload = useCallback(async () => {
    try {
      const list = await listConfiguredKeys()
      setConfigured(list)
    } catch {
      setConfigured([])
    }
  }, [])

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAuthorized(false)
        router.replace("/login")
      } else {
        setAuthorized(true)
        // Firebase can restore the session after the first render. Load keys
        // only once the auth callback has supplied a valid current user.
        void reload()
      }
    })
    return unsub
  }, [reload, router])

  const handleSignOut = async () => {
    if (signingOut || !auth) return
    setSigningOut(true)
    try {
      await signOut(auth)
      router.push("/")
    } finally {
      setSigningOut(false)
    }
  }

  if (!authorized) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <div aria-label="Loading" className="size-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin" />
      </div>
    )
  }

  return (
    <ThemeScope>
    <div className="min-h-dvh bg-background flex flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="flex items-center justify-between h-14 px-4">
          <div className="flex items-center gap-3">
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label="Back">
              <ArrowLeft className="size-4" />
            </Button>
            <h1 className="text-sm font-semibold">Settings</h1>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={handleSignOut} disabled={signingOut} className="text-destructive hover:text-destructive gap-1.5">
            <LogOut className="size-4" />
            {signingOut ? "Signing out..." : "Log out"}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row max-w-4xl mx-auto w-full">
        <nav className="md:w-48 shrink-0 border-b md:border-b-0 md:border-r p-2 md:p-4 md:pt-6">
          <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-x-visible">
            {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveSection(id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                  activeSection === id
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                }`}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </nav>

        <main className="flex-1 p-4 md:p-6 md:pt-6">
          <h2 className="text-sm font-semibold mb-4 hidden md:block">
            {NAV_ITEMS.find((n) => n.id === activeSection)?.label}
          </h2>
          {CONTENT[activeSection]({ configured, reload })}
        </main>
      </div>
    </div>
    </ThemeScope>
  )
}
