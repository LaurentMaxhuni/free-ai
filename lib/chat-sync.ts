import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore"
import { onAuthStateChanged, type Auth } from "firebase/auth"
import { getFirestoreDB } from "./firebase"
import {
  bumpSyncVersion,
  getAllChats,
  getSyncVersion,
  getChat,
  hydrateChats,
  setLocalUid,
  type Chat,
  upsertChat,
  deleteChat as removeLocal,
} from "./chat-storage"
import { decrypt, encrypt, isPortableCiphertext } from "./crypto"
import { getSettings } from "./settings"

let unsubscribe: (() => void) | null = null
let authUnsubscribe: (() => void) | null = null
let boundAuth: Auth | null = null
let currentUid: string | null = null
let syncEpoch = 0
let initialization: { uid: string; epoch: number } | null = null
const retryTimers = new Set<ReturnType<typeof setTimeout>>()
const pendingSync = new Map<string, Chat>()
let syncTimer: ReturnType<typeof setTimeout> | null = null
let remoteApplyQueue: Promise<void> = Promise.resolve()

function clearRetries(): void {
  for (const timer of retryTimers) clearTimeout(timer)
  retryTimers.clear()
}

function cancelPendingSync(): void {
  if (syncTimer) clearTimeout(syncTimer)
  syncTimer = null
  pendingSync.clear()
}

function stopListener(): void {
  if (unsubscribe) {
    unsubscribe()
    unsubscribe = null
  }
}

function isCurrent(uid: string, epoch: number): boolean {
  return currentUid === uid && syncEpoch === epoch
}

function resetForAccountChange(): number {
  syncEpoch += 1
  initialization = null
  stopListener()
  clearRetries()
  cancelPendingSync()
  // A previous user's queued decrypts may still resolve, but every callback
  // checks the new epoch before it can touch the cache.
  remoteApplyQueue = Promise.resolve()
  return syncEpoch
}

function scheduleRetry(uid: string, epoch: number): void {
  if (!isCurrent(uid, epoch)) return
  const timer = setTimeout(() => {
    retryTimers.delete(timer)
    if (!isCurrent(uid, epoch)) return
    initListener(uid, epoch)
    void loadRemoteChats(uid, epoch).catch(() => {
      scheduleRetry(uid, epoch)
    })
  }, 3000)
  retryTimers.add(timer)
}

/**
 * Bind the sync engine once per Firebase Auth instance. This is intentionally
 * idempotent because React Strict Mode and hot reload can initialize client
 * effects more than once; tearing down the first listener in that situation
 * used to leave a signed-in tab with no listener at all.
 */
export function startChatSync(firebaseAuth: Auth | null): void {
  if (!firebaseAuth) return
  if (boundAuth === firebaseAuth && authUnsubscribe) return

  authUnsubscribe?.()
  authUnsubscribe = null
  if (boundAuth && boundAuth !== firebaseAuth) {
    currentUid = null
    setLocalUid(null)
    resetForAccountChange()
  }
  boundAuth = firebaseAuth

  authUnsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
    const nextUid = user?.uid ?? null

    if (nextUid === currentUid) {
      if (nextUid) ensureUserSync(nextUid, syncEpoch)
      else setLocalUid(null)
      return
    }

    const epoch = resetForAccountChange()
    currentUid = nextUid
    setLocalUid(nextUid)
    if (nextUid) ensureUserSync(nextUid, epoch)
  })
}

function ensureUserSync(uid: string, epoch: number): void {
  if (!isCurrent(uid, epoch)) return
  if (initialization?.uid === uid && initialization.epoch === epoch) return
  initialization = { uid, epoch }

  void (async () => {
    await hydrateChats(uid)
    if (!isCurrent(uid, epoch)) return

    // Attach the realtime listener before the one-shot read so updates made
    // while the initial query is in flight cannot be missed.
    initListener(uid, epoch)
    await loadRemoteChats(uid, epoch)
    await migrateLocalChats(uid, epoch)
  })().catch(() => {
    scheduleRetry(uid, epoch)
  })
}

function isRemoteNewer(remote: Chat, local: Chat | null): boolean {
  if (!local) return true
  const remoteVersion = getSyncVersion(remote)
  const localVersion = getSyncVersion(local)
  if (remoteVersion !== localVersion) return remoteVersion > localVersion
  return remote.updatedAt > local.updatedAt
}

type DecryptedRemoteChat = {
  chat: Chat
  needsMigration: boolean
}

async function decryptChat(chat: Chat, uid: string): Promise<DecryptedRemoteChat | null> {
  const first = chat.messages[0]
  if (!first || typeof first.content !== "string" || !first.content.startsWith("ENC:")) {
    return { chat, needsMigration: chat.messages.length > 0 }
  }

  const ciphertext = first.content.slice(4)
  try {
    const decrypted = await decrypt(ciphertext, uid)
    const messages = JSON.parse(decrypted) as Chat["messages"]
    if (!Array.isArray(messages)) return null
    return {
      chat: { ...chat, messages },
      needsMigration: !isPortableCiphertext(ciphertext),
    }
  } catch {
    // Never write an undecryptable remote document over a good local copy.
    // This also makes old session-salt ciphertext wait for the original
    // session to migrate it instead of replacing it with an empty chat.
    return null
  }
}

async function encryptChat(chat: Chat, uid: string): Promise<Chat> {
  if (!chat.messages.length) return chat
  const encryptedMessages = await encrypt(JSON.stringify(chat.messages), uid)
  return {
    ...chat,
    messages: [{ role: "user", content: `ENC:${encryptedMessages}` }],
    _syncVersion: getSyncVersion(chat),
  }
}

async function migrateRemoteChat(
  chat: Chat,
  uid: string,
  epoch: number
): Promise<void> {
  if (!isCurrent(uid, epoch)) return
  const db = getFirestoreDB()
  if (!db) return
  const encrypted = await encryptChat(chat, uid)
  if (!isCurrent(uid, epoch)) return
  await setDoc(doc(db, "users", uid, "chats", chat.id), encrypted)
}

async function applyRemoteDocs(
  docs: QueryDocumentSnapshot<DocumentData>[],
  uid: string,
  epoch: number
): Promise<void> {
  for (const remoteDoc of docs) {
    if (!isCurrent(uid, epoch)) return
    const raw = { ...(remoteDoc.data() as Chat), id: remoteDoc.id }
    const local = getChat(remoteDoc.id)
    const decrypted = await decryptChat(raw, uid)
    if (!decrypted || !isCurrent(uid, epoch)) continue

    const remoteIsNewer = isRemoteNewer(raw, local)
    if (remoteIsNewer) {
      const remoteVersion = getSyncVersion(raw)
      upsertChat({ ...decrypted.chat, _syncVersion: remoteVersion })
    }
    if (decrypted.needsMigration) {
      // Rewrite legacy session-salt records even when the local copy has the
      // same version. Otherwise an old device could read the chat forever but
      // never make it portable for the next device.
      const migrationChat = remoteIsNewer || !local ? decrypted.chat : local
      void migrateRemoteChat(migrationChat, uid, epoch).catch(() => {
        // The realtime listener or the next manual sync can retry migration.
      })
    }
  }
}

function enqueueRemoteDocs(
  docs: QueryDocumentSnapshot<DocumentData>[],
  uid: string,
  epoch: number
): Promise<void> {
  remoteApplyQueue = remoteApplyQueue
    .then(() => applyRemoteDocs(docs, uid, epoch))
    .catch(() => {
      // One malformed document must not prevent later snapshots from being
      // applied. Individual decryption failures are already ignored above.
    })
  return remoteApplyQueue
}

async function loadRemoteChats(uid: string, epoch: number): Promise<void> {
  const db = getFirestoreDB()
  if (!db || !isCurrent(uid, epoch)) return
  const snapshot = await getDocs(collection(db, "users", uid, "chats"))
  await enqueueRemoteDocs(snapshot.docs, uid, epoch)
}

async function migrateLocalChats(uid: string, epoch: number): Promise<void> {
  const db = getFirestoreDB()
  if (!db || !isCurrent(uid, epoch)) return
  const local = getAllChats()
  if (local.length === 0) return

  const snapshot = await getDocs(collection(db, "users", uid, "chats"))
  const existingIds = new Set(snapshot.docs.map((remoteDoc) => remoteDoc.id))
  for (const chat of local) {
    if (!isCurrent(uid, epoch) || existingIds.has(chat.id)) continue
    const encrypted = await encryptChat(chat, uid)
    if (!isCurrent(uid, epoch)) return
    await setDoc(doc(db, "users", uid, "chats", chat.id), encrypted)
  }
}

function initListener(uid: string, epoch: number): void {
  stopListener()
  const db = getFirestoreDB()
  if (!db || !isCurrent(uid, epoch)) return
  const chatsQuery = query(
    collection(db, "users", uid, "chats"),
    orderBy("updatedAt", "desc")
  )

  unsubscribe = onSnapshot(
    chatsQuery,
    (snapshot) => {
      const changedDocs = snapshot
        .docChanges()
        .filter((change) => change.type !== "removed")
        .map((change) => change.doc)
      void enqueueRemoteDocs(changedDocs, uid, epoch)

      for (const change of snapshot.docChanges()) {
        if (change.type === "removed" && isCurrent(uid, epoch)) {
          removeLocal(change.doc.id)
        }
      }
    },
    () => {
      if (!isCurrent(uid, epoch)) return
      stopListener()
      scheduleRetry(uid, epoch)
    }
  )
}

function scheduleFlush(uid: string, epoch: number, delay = 100): void {
  if (syncTimer || pendingSync.size === 0 || !isCurrent(uid, epoch)) return
  syncTimer = setTimeout(() => {
    syncTimer = null
    void flushPending(uid, epoch)
  }, delay)
}

async function flushPending(uid: string, epoch: number): Promise<void> {
  const entries = [...pendingSync.values()]
  pendingSync.clear()
  const db = getFirestoreDB()
  if (!db || !isCurrent(uid, epoch)) return

  let failed = false
  for (const chat of entries) {
    if (!isCurrent(uid, epoch)) return
    const bumped = bumpSyncVersion(chat)
    upsertChat(bumped)
    try {
      const encrypted = await encryptChat(bumped, uid)
      if (!isCurrent(uid, epoch)) return
      await setDoc(doc(db, "users", uid, "chats", bumped.id), encrypted)
    } catch {
      const queued = pendingSync.get(chat.id)
      if (!queued || queued.updatedAt <= chat.updatedAt) {
        pendingSync.set(chat.id, chat)
      }
      failed = true
    }
  }
  if (failed) scheduleFlush(uid, epoch, 1000)
}

export function syncChat(chat: Chat): void {
  const uid = currentUid
  if (!uid || !getSettings().autoSync) return
  pendingSync.set(chat.id, chat)
  scheduleFlush(uid, syncEpoch)
}

export function removeChat(chatId: string): void {
  const uid = currentUid
  if (!uid) return
  pendingSync.delete(chatId)
  const db = getFirestoreDB()
  if (!db) return
  void deleteDoc(doc(db, "users", uid, "chats", chatId)).catch(() => {
    // A later manual sync can retry the operation.
  })
}

export async function syncAllChats(): Promise<void> {
  const uid = currentUid
  const db = getFirestoreDB()
  if (!uid || !db) throw new Error("Chat sync is not available until you are signed in.")
  const epoch = syncEpoch

  await hydrateChats(uid)
  if (!isCurrent(uid, epoch)) return
  await loadRemoteChats(uid, epoch)
  await migrateLocalChats(uid, epoch)

  for (const chat of getAllChats()) {
    if (!isCurrent(uid, epoch)) return
    const bumped = bumpSyncVersion(chat)
    upsertChat(bumped)
    const encrypted = await encryptChat(bumped, uid)
    if (!isCurrent(uid, epoch)) return
    await setDoc(doc(db, "users", uid, "chats", bumped.id), encrypted)
  }
}
