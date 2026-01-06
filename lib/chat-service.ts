import { db } from "./firebase";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

export type ChatSummary = {
  id: string;
  title: string;
  lastMessage?: string;
  model?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
};

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: unknown;
};

const chatsRef = (uid: string) => collection(db, "users", uid, "chats");
const messagesRef = (uid: string, chatId: string) =>
  collection(db, "users", uid, "chats", chatId, "messages");

export async function createChat(uid: string, title: string, model?: string) {
  const ref = await addDoc(chatsRef(uid), {
    title,
    model: model,
    lastMessage: "",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return ref.id;
}

export async function addMessage(
  uid: string,
  chatId: string,
  role: ChatMessage["role"],
  content: string
) {
  const messageNote = await addDoc(messagesRef(uid, chatId), {
    role,
    content,
    createdAt: serverTimestamp(),
  });

  await updateDoc(doc(db, "users", uid, "chats", chatId), {
    lastMessage: content,
    updatedAt: serverTimestamp(),
  });

  return messageNote.id;
}

export function subscribeChats(
  uid: string,
  onChange: (chats: ChatSummary[]) => void
) {
  const qry = query(chatsRef(uid), orderBy("updatedAt", "desc"));
  return onSnapshot(qry, (snap) => {
    const data = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ChatSummary, "id">), // Got help from ChatGPT Codex.
    }));
    onChange(data);
  });
}

export function subscribeMessages(
  uid: string,
  chatId: string,
  onChange: (messages: ChatMessage[]) => void
) {
  const qry = query(messagesRef(uid, chatId), orderBy("createdAt", "asc"));
  return onSnapshot(qry, (snap) => {
    const data = snap.docs.map((docSnap) => ({
      id: docSnap.id,
      ...(docSnap.data() as Omit<ChatMessage, "id">),
    }));
    onChange(data);
  });
}
