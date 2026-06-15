import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
  getDocs,
} from "firebase/firestore"
import { getFirestoreDB } from "./firebase"
import {
  upsertChat,
  deleteChat as removeLocal,
  getAllChats,
  bumpSyncVersion,
  getSyncVersion,
  setLocalUid,
  type Chat,
} from "./chat-storage"
import { onAuthStateChanged, type Auth } from "firebase/auth"
import { encrypt, decrypt } from "./crypto"
import { getSettings } from "./settings"

let unsubscribe: (() => void) | null = null
let currentUid: string | null = null
const retryTimers = new Set<ReturnType<typeof setTimeout>>()

let syncInProgress = false

function clearRetries() {
  for (const t of retryTimers) clearTimeout(t)
  retryTimers.clear()
}

export function startChatSync(auth: Auth | null) {
  if (!auth) return

  onAuthStateChanged(auth, (user) => {
    if (user && user.uid !== currentUid) {
      currentUid = user.uid
      setLocalUid(user.uid)
      initListener(user.uid)
      loadRemoteChats(user.uid)
      migrateLocalChats(user.uid)
    } else if (!user) {
      currentUid = null
      setLocalUid(null)
      stopListener()
      clearRetries()
    }
  })
}

async function loadRemoteChats(uid: string) {
  const db = getFirestoreDB()
  if (!db) return
  try {
    const snapshot = await getDocs(collection(db, "users", uid, "chats"))
    for (const doc of snapshot.docs) {
      const raw = doc.data() as Chat
      const local = getAllChats().find((c) => c.id === doc.id)
      const remoteVersion = raw._syncVersion ?? 0
      const localVersion = local ? getSyncVersion(local) : -1
      if (remoteVersion > localVersion) {
        const decrypted = await decryptChat(raw, uid)
        upsertChat({ ...decrypted, _syncVersion: remoteVersion })
      }
    }
  } catch {
    // offline — localStorage will serve as cache
  }
}

async function encryptChat(chat: Chat): Promise<Chat> {
  if (!chat.messages.length) return chat
  const raw = JSON.stringify(chat.messages)
  const ed = await encrypt(raw, currentUid ?? "")
  return {
    ...chat,
    messages: [{ role: "user", content: "ENC:" + ed }] as Chat["messages"],
    _syncVersion: getSyncVersion(chat),
  }
}

async function decryptChat(chat: Chat, uid: string): Promise<Chat> {
  const first = chat.messages[0]
  if (!first || typeof first.content !== "string" || !first.content.startsWith("ENC:")) return chat
  const ed = first.content.slice(4)
  const decrypted = await decrypt(ed, uid)
  try {
    const messages = JSON.parse(decrypted) as Chat["messages"]
    return { ...chat, messages }
  } catch {
    return chat
  }
}

async function migrateLocalChats(uid: string) {
  const local = getAllChats()
  if (local.length === 0) return
  const db = getFirestoreDB()
  if (!db) return

  const existingIds = new Set<string>()
  const snapshot = await getDocs(collection(db, "users", uid, "chats"))
  snapshot.forEach((d) => existingIds.add(d.id))

  for (const chat of local) {
    if (existingIds.has(chat.id)) continue
    const encrypted = await encryptChat(chat)
    setDoc(doc(db, "users", uid, "chats", chat.id), encrypted).catch(() => {})
  }
}

function initListener(uid: string) {
  stopListener()
  const db = getFirestoreDB()
  if (!db) return
  const q = query(
    collection(db, "users", uid, "chats"),
    orderBy("updatedAt", "desc")
  )
  unsubscribe = onSnapshot(
    q,
    async (snapshot) => {
      if (syncInProgress) return
      for (const change of snapshot.docChanges()) {
        const raw = change.doc.data() as Chat
        const remoteVersion = raw._syncVersion ?? 0
        if (change.type === "removed") {
          removeLocal(change.doc.id)
          continue
        }
        const local = getAllChats().find((c) => c.id === change.doc.id)
        const localVersion = local ? getSyncVersion(local) : -1
        if (remoteVersion <= localVersion) continue
        const decrypted = await decryptChat(raw, uid)
        upsertChat({ ...decrypted, _syncVersion: remoteVersion })
      }
    },
    () => {
      const timer = setTimeout(() => initListener(uid), 3000)
      retryTimers.add(timer)
    }
  )
}

function stopListener() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

let pendingSync: Chat | null = null
let syncTimer: ReturnType<typeof setTimeout> | null = null

export async function syncChat(chat: Chat) {
  if (!currentUid) return
  if (!getSettings().autoSync) return
  pendingSync = chat
  if (syncTimer) return
  syncTimer = setTimeout(async () => {
    syncTimer = null
    const toSync = pendingSync
    pendingSync = null
    if (!toSync || !currentUid) return
    const db = getFirestoreDB()
    if (!db) return
    const bumped = bumpSyncVersion(toSync)
    const local = getAllChats().find((c) => c.id === bumped.id)
    if (local) {
      upsertChat(bumped)
    }
    syncInProgress = true
    try {
      const encrypted = await encryptChat(bumped)
      await setDoc(doc(db, "users", currentUid, "chats", bumped.id), encrypted)
    } catch {
      // silent
    } finally {
      syncInProgress = false
    }
    }, 100)
}

export function removeChat(chatId: string) {
  if (!currentUid) return
  const db = getFirestoreDB()
  if (!db) return
  deleteDoc(doc(db, "users", currentUid, "chats", chatId)).catch(() => {})
}

export async function syncAllChats(): Promise<void> {
  if (!currentUid) return
  const db = getFirestoreDB()
  if (!db) return
  const local = getAllChats()
  syncInProgress = true
  try {
    for (const chat of local) {
      const bumped = bumpSyncVersion(chat)
      upsertChat(bumped)
      const encrypted = await encryptChat(bumped)
      await setDoc(doc(db, "users", currentUid, "chats", bumped.id), encrypted)
    }
  } finally {
    syncInProgress = false
  }
}
