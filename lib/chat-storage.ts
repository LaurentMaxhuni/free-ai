import type { ChatMessage, ChatMode } from "./ai"
import { tryEncrypt, tryDecrypt } from "./crypto"

export type Chat = {
  id: string
  title: string
  mode: ChatMode
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
  _syncVersion?: number
}

const CHATS_KEY = "free-ai:chats"
const ACTIVE_CHAT_KEY = "free-ai:active-chat"
const MAX_CHATS = 100
const UID_KEY = "free-ai:uid"

const changeListeners = new Set<() => void>()
let chatsCache: Chat[] | null = null
let encryptPromise: Promise<void> | null = null

export function setLocalUid(uid: string | null) {
  try {
    if (uid) sessionStorage.setItem(UID_KEY, uid)
    else sessionStorage.removeItem(UID_KEY)
  } catch { /* ignore */ }
}

function getLocalUid(): string | null {
  try { return sessionStorage.getItem(UID_KEY) } catch { return null }
}

export function onChatsChange(cb: () => void): () => void {
  changeListeners.add(cb)
  return () => { changeListeners.delete(cb) }
}

function notifyChange() {
  changeListeners.forEach(cb => cb())
}

function isClient(): boolean {
  return typeof window !== "undefined"
}

export function getAllChats(): Chat[] {
  if (!isClient()) return []
  if (chatsCache) return chatsCache
  try {
    const raw = localStorage.getItem(CHATS_KEY)
    if (!raw) {
      chatsCache = []
      return chatsCache
    }
    const uid = getLocalUid()
    if (uid) {
      try {
        const decrypted = tryDecrypt(raw, uid)
        if (typeof decrypted === "string") {
          const parsed = JSON.parse(decrypted)
          if (Array.isArray(parsed)) {
            chatsCache = parsed.filter(isValidChat)
            return chatsCache
          }
        }
      } catch { /* fall through to plain text */ }
    }
    const parsed = JSON.parse(raw)
    chatsCache = Array.isArray(parsed) ? parsed.filter(isValidChat) : []
  } catch {
    chatsCache = []
  }
  return chatsCache ?? []
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
  try {
    const raw = JSON.stringify(chatsCache)
    const uid = getLocalUid()
    if (uid) {
      const encrypted = await tryEncrypt(raw, uid)
      localStorage.setItem(CHATS_KEY, encrypted)
    } else {
      localStorage.setItem(CHATS_KEY, raw)
    }
  } catch {
    /* storage may be full or disabled */
  }
  notifyChange()
}

function schedulePersist() {
  encryptPromise = Promise.resolve(encryptPromise).then(() => persistChats()).catch(() => {})
}

export function getChat(id: string): Chat | null {
  return getAllChats().find((c) => c.id === id) ?? null
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
  const chats = getAllChats()
  const index = chats.findIndex((c) => c.id === chat.id)
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
    if (chats.length > MAX_CHATS) {
      chats.length = MAX_CHATS
    }
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
  const chats = getAllChats().filter((c) => c.id !== id)
  chatsCache = chats
  schedulePersist()
  if (isClient() && localStorage.getItem(ACTIVE_CHAT_KEY) === id) {
    localStorage.removeItem(ACTIVE_CHAT_KEY)
  }
}

export function getActiveChatId(): string | null {
  if (!isClient()) return null
  try {
    return localStorage.getItem(ACTIVE_CHAT_KEY)
  } catch {
    return null
  }
}

export function setActiveChatId(id: string | null): void {
  if (!isClient()) return
  try {
    if (id) {
      localStorage.setItem(ACTIVE_CHAT_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_CHAT_KEY)
    }
  } catch {
    /* ignore */
  }
}

export function deriveTitle(content: string, max = 40): string {
  const trimmed = content.trim().replace(/\s+/g, " ")
  if (trimmed.length <= max) return trimmed
  return `${trimmed.slice(0, max).trimEnd()}…`
}
