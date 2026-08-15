import type { ChatMessage, ChatMode } from "./ai"
import { decrypt, tryEncrypt, tryDecrypt } from "./crypto"

export type Chat = {
  id: string
  title: string
  mode: ChatMode
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  _syncVersion?: number
}

const CHATS_KEY_PREFIX = "free-ai:chats:"
const ACTIVE_CHAT_KEY_PREFIX = "free-ai:active-chat:"
const LEGACY_CHATS_KEY = "free-ai:chats"
const MAX_CHATS = 100
const UID_KEY = "free-ai:uid"

const changeListeners = new Set<() => void>()
let chatsCache: { uid: string; chats: Chat[] } | null = null
let hydratePromise: Promise<void> | null = null
let persistQueue: Promise<void> = Promise.resolve()
let hydratedUid: string | null = null
let legacyMigrationUid: string | null = null
let lastSetUid: string | null | undefined

export function setLocalUid(uid: string | null): void {
  const previousUid = getLocalUid()
  if (previousUid === uid) {
    // The previous version kept its unscoped cache in localStorage. It is
    // safe to migrate it only when Firebase restored the same UID that was
    // already present in this browser session; never reuse it after logout or
    // for a different account.
    if (lastSetUid === undefined && uid) legacyMigrationUid = uid
    lastSetUid = uid
    return
  }

  chatsCache = null
  hydratePromise = null
  hydratedUid = null
  legacyMigrationUid = null
  lastSetUid = uid
  // A queued write must not be allowed to use the next account's storage key.
  persistQueue = Promise.resolve()

  try {
    if (uid) sessionStorage.setItem(UID_KEY, uid)
    else sessionStorage.removeItem(UID_KEY)
  } catch {
    /* ignore */
  }

  if (!uid) {
    try {
      // The active chat id is account-scoped below; remove the legacy global
      // value so logout cannot select a chat for a later account.
      localStorage.removeItem("free-ai:active-chat")
      // The old cache was not account-scoped. It must not survive logout,
      // where a later account could otherwise mistake it for its own data.
      localStorage.removeItem(LEGACY_CHATS_KEY)
    } catch {
      /* ignore */
    }
  }
  notifyChange()
}

function getLocalUid(): string | null {
  try {
    return sessionStorage.getItem(UID_KEY)
  } catch {
    return null
  }
}

function chatsStorageKey(uid: string): string {
  return `${CHATS_KEY_PREFIX}${encodeURIComponent(uid)}`
}

function activeChatStorageKey(uid: string): string {
  return `${ACTIVE_CHAT_KEY_PREFIX}${encodeURIComponent(uid)}`
}

export function onChatsChange(cb: () => void): () => void {
  changeListeners.add(cb)
  return () => { changeListeners.delete(cb) }
}

function notifyChange(): void {
  changeListeners.forEach((cb) => cb())
}

function isClient(): boolean {
  return typeof window !== "undefined"
}

function parseChats(value: string): Chat[] | null {
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.filter(isValidChat) : []
  } catch {
    return null
  }
}

/**
 * Decrypt the account's local cache before the chat UI reads it. WebCrypto is
 * asynchronous, so synchronous callers receive the current in-memory cache
 * and are notified once hydration finishes.
 */
export async function hydrateChats(uid = getLocalUid()): Promise<void> {
  if (!isClient() || !uid) return
  if (chatsCache?.uid === uid && hydratedUid === uid) return
  if (hydratePromise) return hydratePromise

  hydratePromise = (async () => {
    let raw: string | null = null
    let legacyRaw: string | null = null
    try {
      raw = localStorage.getItem(chatsStorageKey(uid))
      if (legacyMigrationUid === uid) {
        legacyRaw = localStorage.getItem(LEGACY_CHATS_KEY)
      }
    } catch {
      raw = null
      legacyRaw = null
    }

    const caches: Chat[][] = []
    if (raw) {
      const decrypted = await tryDecrypt(raw, uid)
      caches.push(parseChats(decrypted) ?? parseChats(raw) ?? [])
    }
    let migratedLegacy = false
    if (legacyRaw) {
      // The legacy cache was unscoped. Only migrate it when its old
      // ciphertext authenticates with this UID; never parse legacy plaintext
      // that could belong to a different account.
      try {
        const decrypted = await decrypt(legacyRaw, uid)
        const legacyChats = parseChats(decrypted)
        if (legacyChats) {
          caches.push(legacyChats)
          migratedLegacy = true
        }
      } catch {
        /* legacy cache belongs to another session or is no longer readable */
      }
    }

    const chats = [...new Map(caches.flat().map((chat) => [chat.id, chat])).values()]

    if (getLocalUid() !== uid) return
    // If a caller edited the cache while WebCrypto was hydrating, preserve
    // that newer in-memory edit instead of replacing it with the disk copy.
    const current = chatsCache?.uid === uid ? chatsCache.chats : []
    const merged = new Map(chats.map((chat) => [chat.id, chat]))
    for (const chat of current) {
      const stored = merged.get(chat.id)
      if (!stored || chat.updatedAt >= stored.updatedAt) merged.set(chat.id, chat)
    }
    chatsCache = { uid, chats: [...merged.values()].sort((a, b) => b.updatedAt - a.updatedAt) }
    hydratedUid = uid
    if (migratedLegacy) {
      try {
        localStorage.removeItem(LEGACY_CHATS_KEY)
      } catch {
        /* ignore */
      }
      schedulePersist()
    }
    notifyChange()
  })().finally(() => {
    hydratePromise = null
  })

  return hydratePromise
}

export function getAllChats(): Chat[] {
  if (!isClient()) return []
  const uid = getLocalUid()
  if (!uid) return []
  if (chatsCache?.uid === uid) return chatsCache.chats

  // Plaintext caches can be read synchronously. Encrypted caches are hydrated
  // asynchronously because WebCrypto promises cannot be made synchronous.
  if (!chatsCache) {
    try {
      const raw = localStorage.getItem(chatsStorageKey(uid))
      if (!raw) {
        chatsCache = { uid, chats: [] }
      } else {
        const parsed = !raw.startsWith("v2.") ? parseChats(raw) : null
        if (parsed) chatsCache = { uid, chats: parsed }
      }
    } catch {
      chatsCache = { uid, chats: [] }
    }
  }
  if (!chatsCache) {
    void hydrateChats(uid)
    return []
  }
  return chatsCache.chats
}

function isValidChat(value: unknown): value is Chat {
  if (!value || typeof value !== "object") return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === "string" &&
    typeof v.title === "string" &&
    (v.mode === "text" || v.mode === "image") &&
    Array.isArray(v.messages) &&
    typeof v.createdAt === "number" &&
    typeof v.updatedAt === "number"
  )
}

async function persistChats(): Promise<void> {
  if (!isClient() || !chatsCache) return
  const snapshot = chatsCache
  try {
    const raw = JSON.stringify(snapshot.chats)
    const encrypted = await tryEncrypt(raw, snapshot.uid)
    if (getLocalUid() !== snapshot.uid || chatsCache?.uid !== snapshot.uid) return
    localStorage.setItem(chatsStorageKey(snapshot.uid), encrypted)
  } catch {
    /* storage may be full or disabled */
  }
  notifyChange()
}

function schedulePersist(): void {
  persistQueue = persistQueue.then(() => persistChats()).catch(() => {})
}

export function getChat(id: string): Chat | null {
  return getAllChats().find((chat) => chat.id === id) ?? null
}

export function createChat(mode: ChatMode = "text"): Chat {
  const now = Date.now()
  return {
    id: `chat_${now.toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    title: "New chat",
    mode,
    messages: [],
    createdAt: now,
    updatedAt: now,
    _syncVersion: 0,
  }
}

export function upsertChat(chat: Chat): void {
  const uid = getLocalUid()
  if (!uid) return
  const chats = getAllChats()
  if (!chatsCache || chatsCache.uid !== uid) chatsCache = { uid, chats }
  const index = chats.findIndex((item) => item.id === chat.id)
  if (index >= 0) {
    const existing = chats[index]
    if (
      chat._syncVersion !== undefined &&
      existing._syncVersion !== undefined &&
      chat._syncVersion < existing._syncVersion
    ) {
      return
    }
    chats[index] = chat
  } else {
    chats.unshift(chat)
    if (chats.length > MAX_CHATS) chats.length = MAX_CHATS
  }
  schedulePersist()
}

export function bumpSyncVersion(chat: Chat): Chat {
  return { ...chat, _syncVersion: (chat._syncVersion ?? 0) + 1 }
}

export function getSyncVersion(chat: Chat): number {
  return chat._syncVersion ?? 0
}

export function deleteChat(id: string): void {
  const uid = getLocalUid()
  if (!uid) return
  const chats = getAllChats().filter((chat) => chat.id !== id)
  chatsCache = { uid, chats }
  schedulePersist()
  if (isClient() && localStorage.getItem(activeChatStorageKey(uid)) === id) {
    localStorage.removeItem(activeChatStorageKey(uid))
  }
}

export function getActiveChatId(): string | null {
  const uid = getLocalUid()
  if (!isClient() || !uid) return null
  try {
    return localStorage.getItem(activeChatStorageKey(uid))
  } catch {
    return null
  }
}

export function setActiveChatId(id: string | null): void {
  const uid = getLocalUid()
  if (!isClient() || !uid) return
  try {
    if (id) localStorage.setItem(activeChatStorageKey(uid), id)
    else localStorage.removeItem(activeChatStorageKey(uid))
  } catch {
    /* ignore */
  }
}

export function deriveTitle(content: string, max = 40): string {
  const trimmed = content.trim().replace(/\s+/g, " ")
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}
