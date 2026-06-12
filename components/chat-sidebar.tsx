"use client"

import { useEffect, useState, type MouseEvent } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { signOut, onAuthStateChanged } from "firebase/auth"
import { Plus, Trash2, MessageSquare, Image as ImageIcon, LogOut } from "lucide-react"
import { auth } from "@/lib/firebase"
import {
  type Chat,
  deleteChat,
  deriveTitle,
  getAllChats,
  onChatsChange,
  setActiveChatId,
} from "@/lib/chat-storage"
import { removeChat } from "@/lib/chat-sync"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"

type Props = {
  currentChatId: string | null
  onSelect: (id: string) => void
  onNewChat: () => void
  onClose?: () => void
}

type UserSummary = {
  displayName: string | null
  email: string | null
  photoURL: string | null
}

export function ChatSidebar({ currentChatId, onSelect, onNewChat, onClose }: Props) {
  const router = useRouter()
  const [chats, setChats] = useState<Chat[]>([])
  const [user, setUser] = useState<UserSummary | null>(null)
  const [busy, setBusy] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  useEffect(() => {
    setChats(getAllChats())
  }, [currentChatId])

  useEffect(() => {
    const unsub = onChatsChange(() => setChats(getAllChats()))
    return unsub
  }, [])

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (current) => {
      if (!current) {
        setUser(null)
        return
      }
      setUser({
        displayName: current.displayName,
        email: current.email,
        photoURL: current.photoURL,
      })
    })
    return () => unsubscribe()
  }, [])

  const handleSelect = (id: string) => {
    setActiveChatId(id)
    onSelect(id)
  }

  const handleNew = () => {
    setActiveChatId(null)
    onNewChat()
  }

  const handleDelete = (id: string, event: MouseEvent) => {
    event.stopPropagation()
    setDeleteConfirmId(id)
  }

  const confirmDelete = () => {
    if (!deleteConfirmId) return
    removeChat(deleteConfirmId)
    deleteChat(deleteConfirmId)
    setChats(getAllChats())
    if (deleteConfirmId === currentChatId) {
      handleNew()
    }
    setDeleteConfirmId(null)
  }

  const handleSignOut = async () => {
    if (busy || !auth) return
    setBusy(true)
    try {
      await signOut(auth)
      setActiveChatId(null)
      router.push("/")
    } finally {
      setBusy(false)
    }
  }

  const sortedChats = [...chats].sort((a, b) => b.updatedAt - a.updatedAt)

  return (
    <div className="h-full flex flex-col bg-card/30">
      <div className="p-4 flex items-center justify-between border-b">
        <Link href="/" onClick={() => onClose?.()} className="block">
          <Logo className="text-xl" />
        </Link>
        {onClose ? (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="md:hidden"
            aria-label="Close sidebar"
          >
            <span aria-hidden className="text-lg leading-none">×</span>
          </Button>
        ) : null}
      </div>

      <div className="px-3 py-3">
        <Button
          type="button"
          onClick={handleNew}
          variant="outline"
          className="w-full justify-start gap-2"
        >
          <Plus className="size-4" />
          New chat
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1">
        {sortedChats.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-8">
            No chats yet. Start a new one!
          </p>
        ) : (
          sortedChats.map((chat) => {
            const isActive = chat.id === currentChatId
            const title = chat.messages.length > 0
              ? deriveTitle(
                  chat.messages.find((m) => m.role === "user")?.content ?? chat.title,
                  36
                )
              : "New chat"
            return (
              <div
                key={chat.id}
                role="button"
                tabIndex={0}
                aria-current={isActive ? "true" : undefined}
                onClick={() => handleSelect(chat.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    handleSelect(chat.id)
                  }
                }}
                className={cn(
                  "group flex items-center gap-2 px-3 py-2 rounded-full text-sm cursor-pointer transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                )}
              >
                {chat.mode === "image" ? (
                  <ImageIcon className="size-4 shrink-0" />
                ) : (
                  <MessageSquare className="size-4 shrink-0" />
                )}
                <span className="flex-1 truncate text-left">{title}</span>
                <button
                  type="button"
                  onClick={(event) => handleDelete(chat.id, event)}
                  className="opacity-40 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive cursor-pointer"
                  aria-label="Delete chat"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            )
          })
        )}
      </div>

      {user ? (
        <div className="border-t p-3 flex items-center gap-3">
          {user.photoURL ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.photoURL}
              alt={user.displayName ?? "User avatar"}
              className="size-9 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="size-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-medium">
              {(user.displayName ?? user.email ?? "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">
              {user.displayName ?? "Signed in"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {user.email ?? "Free plan"}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            disabled={busy}
            aria-label="Sign out"
          >
            <LogOut className="size-4" />
          </Button>
        </div>
      ) : null}

      <AlertDialog open={deleteConfirmId !== null} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The chat history will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-2">
            <AlertDialogCancel onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/80">
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
