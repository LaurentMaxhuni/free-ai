"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Menu, Sparkles } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"
import { getSettings } from "@/lib/settings"
import { AuthGuard } from "@/components/auth-guard"
import { ChatSidebar } from "@/components/chat-sidebar"
import { ChatMessages } from "@/components/chat-messages"
import { ChatInput } from "@/components/chat-input"
import { ChatEmpty } from "@/components/chat-empty"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
  type Chat,
  createChat,
  deriveTitle,
  getActiveChatId,
  getChat,
  setActiveChatId,
  upsertChat,
} from "@/lib/chat-storage"
import {
  type ChatMode,
  buildImageMessage,
  generateTextStream,
} from "@/lib/ai"

function ChatViewInner() {
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const id = getActiveChatId()
    if (id) {
      const chat = getChat(id)
      if (chat) {
        setActiveChat(chat)
      }
    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  const handleNewChat = useCallback(() => {
    setActiveChat(null)
    setActiveChatId(null)
    setStreamingContent("")
  }, [])

  const handleSelectChat = useCallback((id: string) => {
    const chat = getChat(id)
    if (chat) {
      setActiveChat(chat)
    }
    setStreamingContent("")
    setSidebarOpen(false)
  }, [])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
    setStreamingContent("")
  }, [])

  const handleSend = useCallback(
    async (content: string, mode: ChatMode) => {
      if (isGenerating) return

      const userMessage = { role: "user" as const, content }

      let chat: Chat
      if (!activeChat) {
        chat = createChat(mode)
        chat.title = deriveTitle(content)
      } else {
        chat = {
          ...activeChat,
          mode,
        }
        if (!chat.title || chat.title === "New chat") {
          chat.title = deriveTitle(content)
        }
      }
      chat.messages = [...chat.messages, userMessage]
      chat.updatedAt = Date.now()
      setActiveChat(chat)
      upsertChat(chat)
      setActiveChatId(chat.id)

      const controller = new AbortController()
      abortRef.current = controller
      setIsGenerating(true)
      setStreamingContent("")

      try {
        if (mode === "image") {
          const assistantMessage = await buildImageMessage(content)
          const updated: Chat = {
            ...chat,
            messages: [...chat.messages, assistantMessage],
            updatedAt: Date.now(),
          }
          setActiveChat(updated)
          upsertChat(updated)
        } else {
          const apiMessages = chat.messages
            .filter((m) => m.role !== "system")
            .map(({ role, content: c }) => ({ role, content: c }))

          let fullContent = ""

          await generateTextStream(apiMessages, controller.signal, {
            onToken: (token) => {
              fullContent += token
              setStreamingContent(fullContent)
            },
            onDone: () => {
              const assistantMessage = {
                role: "assistant" as const,
                content: fullContent,
              }
              setActiveChat((prev) => {
                if (!prev) return prev
                const updated: Chat = {
                  ...prev,
                  messages: [...prev.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
                upsertChat(updated)
                return updated
              })
              setStreamingContent("")
            },
            onError: (error) => {
              throw error
            },
          })
        }
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return
        }
        const errorMessage = {
          role: "assistant" as const,
          content:
            "Sorry, something went wrong while generating a response. Please try again.",
        }
        setActiveChat((prev) => {
          if (!prev) return prev
          const updated: Chat = {
            ...prev,
            messages: [...prev.messages, errorMessage],
            updatedAt: Date.now(),
          }
          upsertChat(updated)
          return updated
        })
        setStreamingContent("")
      } finally {
        setIsGenerating(false)
        abortRef.current = null
      }
    },
    [activeChat, isGenerating]
  )

  const handleSuggestion = useCallback(
    (suggestion: string, mode: ChatMode) => {
      void handleSend(suggestion, mode)
    },
    [handleSend]
  )

  const sidebar = (
    <ChatSidebar
      currentChatId={activeChat?.id ?? null}
      onSelect={handleSelectChat}
      onNewChat={handleNewChat}
      onClose={() => setSidebarOpen(false)}
    />
  )

  const headerTitle =
    activeChat && activeChat.messages.length > 0
      ? deriveTitle(
          activeChat.messages.find((m) => m.role === "user")?.content ??
            activeChat.title,
          40
        )
      : activeChat?.title ?? "New chat"

  return (
    <div className="h-screen flex bg-background overflow-hidden">
      <aside className="hidden md:flex w-72 border-r shrink-0 flex-col">
        {sidebar}
      </aside>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <VisuallyHidden>
          <SheetTitle>Chat history</SheetTitle>
        </VisuallyHidden>
        <SheetContent side="left" className="w-72 p-0 sm:max-w-none">
          {sidebar}
        </SheetContent>
      </Sheet>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b flex items-center justify-between gap-2 px-4 shrink-0 bg-background/80 backdrop-blur">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="md:hidden shrink-0"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open sidebar"
            >
              <Menu className="size-4" />
            </Button>
            <Sparkles className="size-4 text-primary shrink-0" />
            <h1 className="text-sm font-semibold truncate">{headerTitle}</h1>
            <span className="text-xs text-muted-foreground hidden sm:inline truncate">
              · {getSettings().provider}
            </span>
          </div>
          <SettingsDialog />
        </header>

        <div className="flex-1 overflow-y-auto">
          {hydrated && (!activeChat || activeChat.messages.length === 0) ? (
            <ChatEmpty onSuggestion={handleSuggestion} />
          ) : (
            <ChatMessages
              messages={activeChat?.messages ?? []}
              isGenerating={isGenerating}
              streamingContent={streamingContent}
            />
          )}
        </div>

        <div className="border-t p-4 shrink-0 bg-background">
          <ChatInput
            onSend={handleSend}
            onStop={handleStop}
            isGenerating={isGenerating}
            initialMode={activeChat?.mode ?? "text"}
            disabled={!hydrated}
          />
        </div>
      </main>
    </div>
  )
}

export function ChatView() {
  return (
    <AuthGuard>
      <ChatViewInner />
    </AuthGuard>
  )
}
