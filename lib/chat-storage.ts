import type { ChatMessage, ChatMode } from "./ai"

export type Chat = {
  id: string
  title: string
  mode: ChatMode
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

const CHATS_KEY = "free-ai:chats"
const ACTIVE_CHAT_KEY = "free-ai:active-chat"
const MAX_CHATS = 100

const changeListeners = new Set<() => void>()

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
  try {
    const raw = window.localStorage.getItem(CHATS_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidChat)
  } catch {
    return []
  }
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

function saveChats(chats: Chat[]): void {
  if (!isClient()) return
  try {
    window.localStorage.setItem(CHATS_KEY, JSON.stringify(chats))
  } catch {
    /* storage may be full or disabled */
  }
  notifyChange()
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
  }
}

export function upsertChat(chat: Chat): void {
  const chats = getAllChats()
  const index = chats.findIndex((c) => c.id === chat.id)
  if (index >= 0) {
    chats[index] = chat
  } else {
    chats.unshift(chat)
    if (chats.length > MAX_CHATS) {
      chats.length = MAX_CHATS
    }
  }
  saveChats(chats)
}

export function deleteChat(id: string): void {
  const chats = getAllChats().filter((c) => c.id !== id)
  saveChats(chats)
  if (isClient() && window.localStorage.getItem(ACTIVE_CHAT_KEY) === id) {
    window.localStorage.removeItem(ACTIVE_CHAT_KEY)
  }
}

export function getActiveChatId(): string | null {
  if (!isClient()) return null
  try {
    return window.localStorage.getItem(ACTIVE_CHAT_KEY)
  } catch {
    return null
  }
}

export function setActiveChatId(id: string | null): void {
  if (!isClient()) return
  try {
    if (id) {
      window.localStorage.setItem(ACTIVE_CHAT_KEY, id)
    } else {
      window.localStorage.removeItem(ACTIVE_CHAT_KEY)
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
