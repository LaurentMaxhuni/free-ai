import {
  doc,
  setDoc,
  deleteDoc,
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore"
import { getFirestoreDB } from "./firebase"
import { upsertChat, deleteChat as removeLocal, getAllChats, type Chat } from "./chat-storage"
import { onAuthStateChanged, type Auth } from "firebase/auth"
import { encrypt, decrypt } from "./crypto"

let unsubscribe: (() => void) | null = null
let currentUid: string | null = null
const retryTimers = new Set<ReturnType<typeof setTimeout>>()

function clearRetries() {
  for (const t of retryTimers) clearTimeout(t)
  retryTimers.clear()
}

export function startChatSync(auth: Auth | null) {
  if (!auth) return

  onAuthStateChanged(auth, (user) => {
    if (user && user.uid !== currentUid) {
      currentUid = user.uid
      initListener(user.uid)
      migrateLocalChats(user.uid)
    } else if (!user) {
      currentUid = null
      stopListener()
      clearRetries()
    }
  })
}

async function encryptChat(chat: Chat): Promise<Chat> {
  if (!chat.messages.length) return chat
  const raw = JSON.stringify(chat.messages)
  const ed = await encrypt(raw, currentUid ?? "")
  return { ...chat, messages: [{ role: "user", content: "ENC:" + ed }] as Chat["messages"] }
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
  for (const chat of local) {
    const encrypted = await encryptChat(chat)
    setDoc(doc(db, "users", uid, "chats", chat.id), encrypted)
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
  unsubscribe = onSnapshot(q, async (snapshot) => {
    for (const change of snapshot.docChanges()) {
      const raw = change.doc.data() as Chat
      const decrypted = await decryptChat(raw, uid)
      if (change.type === "added" || change.type === "modified") {
        upsertChat(decrypted)
      } else if (change.type === "removed") {
        removeLocal(change.doc.id)
      }
    }
  }, () => {
    const timer = setTimeout(() => initListener(uid), 3000)
    retryTimers.add(timer)
  })
}

function stopListener() {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

export async function syncChat(chat: Chat) {
  if (!currentUid) return
  const db = getFirestoreDB()
  if (!db) return
  const encrypted = await encryptChat(chat)
  setDoc(doc(db, "users", currentUid, "chats", chat.id), encrypted)
}

export function removeChat(chatId: string) {
  if (!currentUid) return
  const db = getFirestoreDB()
  if (!db) return
  deleteDoc(doc(db, "users", currentUid, "chats", chatId))
}
