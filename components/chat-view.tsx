"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Menu, Sparkles } from "lucide-react"
import { SettingsDialog } from "@/components/settings-dialog"
import { getSettings, saveSettings } from "@/lib/settings"
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
import { CodePreviewPanel } from "@/components/code-preview-panel"
import { ResizablePanel } from "@/components/ui/resizable-panel"
import { extractCodeBlocks, type CodePreviewContent } from "@/components/markdown-renderer"
import {
  type Chat,
  createChat,
  deriveTitle,
  getActiveChatId,
  getChat,
  onChatsChange,
  setActiveChatId,
  upsertChat,
} from "@/lib/chat-storage"
import type { ChatMessage } from "@/lib/ai"
import {
  type ChatMode,
  type FileAttachment,
  buildImageMessage,
  buildMultimodalContent,
  generateTextStream,
} from "@/lib/ai"
import { startChatSync, syncChat } from "@/lib/chat-sync"
import { auth } from "@/lib/firebase"
import { onAuthStateChanged, type User } from "firebase/auth"
import { PROVIDERS } from "@/lib/providers"

function ChatViewInner() {
  const [activeChat, setActiveChat] = useState<Chat | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [reasoningContent, setReasoningContent] = useState("")
  const [previewBlocks, setPreviewBlocks] = useState<CodePreviewContent[]>([])
  const [showPreviewPanel, setShowPreviewPanel] = useState(false)
  const [userName, setUserName] = useState("")
  const [userAvatar, setUserAvatar] = useState("")
  const [modelVersion, setModelVersion] = useState(0)
  const abortRef = useRef<AbortController | null>(null)
  const bufferRef = useRef("")
  const reasoningBufferRef = useRef("")
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (!auth) return
    const unsub = onAuthStateChanged(auth, (user) => {
      setUserName(user?.displayName ?? "")
      setUserAvatar(user?.photoURL ?? "")
    })
    return unsub
  }, [])

  useEffect(() => {
    if (!auth) return
    startChatSync(auth)
  }, [])

  useEffect(() => {
    const unsub = onChatsChange(() => {
      const id = getActiveChatId()
      if (id) {
        const chat = getChat(id)
        if (chat) setActiveChat(chat)
      }
    })
    return unsub
  }, [])

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

  const handleModelChange = useCallback(() => {
    setModelVersion((v) => v + 1)
  }, [])

  const handleNewChat = useCallback(() => {
    setActiveChat(null)
    setActiveChatId(null)
    setStreamingContent("")
    setReasoningContent("")
    bufferRef.current = ""
    reasoningBufferRef.current = ""
    setPreviewBlocks([])
    setShowPreviewPanel(false)
    setSidebarOpen(false)
  }, [])

  const handleSelectChat = useCallback((id: string) => {
    const chat = getChat(id)
    if (chat) {
      setActiveChat(chat)
    }
    setStreamingContent("")
    setReasoningContent("")
    bufferRef.current = ""
    reasoningBufferRef.current = ""
    setPreviewBlocks([])
    setShowPreviewPanel(false)
    setSidebarOpen(false)
  }, [])

  const handleStop = useCallback(() => {
    abortRef.current?.abort()
    setIsGenerating(false)
    bufferRef.current = ""
    reasoningBufferRef.current = ""
    setStreamingContent("")
    setReasoningContent("")
  }, [])

  const handleSend = useCallback(
    async (content: string, mode: ChatMode, searchEnabled?: boolean, attachments?: FileAttachment[]) => {
      if (isGenerating) return

      const userMessage: ChatMessage & { attachments?: FileAttachment[] } = {
        role: "user" as const,
        content,
        ...(attachments && attachments.length > 0 ? { attachments } : {}),
      }

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
      syncChat(chat)
      setActiveChatId(chat.id)

      let searchContext = ""
      if (searchEnabled && mode === "text") {
        try {
          const searchRes = await fetch("/api/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: content }),
          })
          if (searchRes.ok) {
            const searchData = await searchRes.json()
            if (searchData.results) {
              searchContext = `Web search results for "${content}":\n\n${searchData.results}`
            }
          }
        } catch {
          /* search failure is non-fatal */
        }
      }

      const controller = new AbortController()
      abortRef.current = controller
      setIsGenerating(true)
      setStreamingContent("")

      const flush = () => {
        if (rafRef.current !== null) return
        rafRef.current = requestAnimationFrame(() => {
          rafRef.current = null
          setStreamingContent(bufferRef.current)
          setReasoningContent(reasoningBufferRef.current)
        })
      }

      const hasImageAttachments = attachments?.some((a) => a.type === "image")
      if (hasImageAttachments && !PROVIDERS[getSettings().provider].capabilities.includes("image")) {
        setActiveChat((prev) => {
          if (!prev) return prev
          const updated: Chat = {
            ...prev,
            messages: [...prev.messages, { role: "assistant", content: "This provider does not support image attachments. Switch to a provider that supports images (e.g., Free.ai) or remove the image." }],
            updatedAt: Date.now(),
          }
          upsertChat(updated)
          syncChat(updated)
          return updated
        })
        setIsGenerating(false)
        abortRef.current = null
        return
      }

      try {
        if (mode === "image") {
          saveSettings({
            provider: "freeai",
            imageModel: "@cf/black-forest-labs/flux-1-schnell",
          })
          const assistantMessage = await buildImageMessage(content)
          const updated: Chat = {
            ...chat,
            messages: [...chat.messages, assistantMessage],
            updatedAt: Date.now(),
          }
          setActiveChat(updated)
          upsertChat(updated)
          syncChat(updated)
        } else {
          const systemMessages = searchContext
            ? [{ role: "system" as const, content: searchContext }]
            : []
          const userIntro = userName
            ? `The user's name is ${userName}. Address them by name naturally.`
            : ""
          const apiMessages = [
            ...(userIntro ? [{ role: "system" as const, content: userIntro }] : []),
            ...systemMessages,
            ...chat.messages
              .filter((m) => m.role !== "system")
              .map((m) => ({
                role: m.role,
                content: buildMultimodalContent(m as ChatMessage & { attachments?: FileAttachment[] }),
              })),
          ]

          bufferRef.current = ""
          reasoningBufferRef.current = ""

          await generateTextStream(apiMessages, controller.signal, {
            onToken: (token) => {
              bufferRef.current += token
              flush()
            },
            onReasoning: (token) => {
              reasoningBufferRef.current += token
              flush()
            },
            onDone: () => {
              if (rafRef.current !== null) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
              }
              setStreamingContent(bufferRef.current)
              setReasoningContent(reasoningBufferRef.current)
              const assistantMessage = {
                role: "assistant" as const,
                content: bufferRef.current,
              }
              setActiveChat((prev) => {
                if (!prev) return prev
                const updated: Chat = {
                  ...prev,
                  messages: [...prev.messages, assistantMessage],
                  updatedAt: Date.now(),
                }
                  upsertChat(updated)
                  syncChat(updated)
                  return updated
                })
                bufferRef.current = ""
                reasoningBufferRef.current = ""
                setStreamingContent("")
                setReasoningContent("")
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
        const detail = error instanceof Error ? error.message : "Please try again."
        const friendly = /does not support image/i.test(detail)
          ? "This model does not support image attachments. Try switching to a model that supports images, or remove the image and try again."
          : `Error: ${detail}`
        const errorMessage = {
          role: "assistant" as const,
          content: friendly,
        }
        setActiveChat((prev) => {
          if (!prev) return prev
          const updated: Chat = {
            ...prev,
            messages: [...prev.messages, errorMessage],
            updatedAt: Date.now(),
          }
          upsertChat(updated)
          syncChat(updated)
          return updated
        })
        bufferRef.current = ""
        reasoningBufferRef.current = ""
        setStreamingContent("")
        setReasoningContent("")
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

  const scanPreviewBlocks = useCallback(() => {
    const msgs = activeChat?.messages ?? []
    const allContent = [...msgs.map((m) => m.content), streamingContent]
      .filter(Boolean)
      .join("\n\n")
    setPreviewBlocks(extractCodeBlocks(allContent))
  }, [activeChat, streamingContent])

  useEffect(() => {
    if (showPreviewPanel) scanPreviewBlocks()
  }, [activeChat?.messages, streamingContent, showPreviewPanel, scanPreviewBlocks])

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

  const currentSettings = getSettings()
  const currentProviderName = PROVIDERS[currentSettings.provider]?.name ?? currentSettings.provider
  const currentModelId = currentSettings.textModel
  const currentModelLabel = Object.values(PROVIDERS)
    .flatMap((p) => p.textModels)
    .find((m) => m.id === currentModelId)?.label ?? currentModelId

  return (
    <div className="h-dvh flex bg-background overflow-hidden">
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

      <main className="flex-1 flex min-w-0">
        {showPreviewPanel && previewBlocks.length > 0 && (
          <div className="sm:hidden flex flex-col flex-1 min-w-0">
            <header className="h-14 border-b flex items-center gap-2 px-4 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setShowPreviewPanel(false)}
                aria-label="Back to chat"
              >
                <span className="text-sm">← Back</span>
              </Button>
              <span className="text-xs font-medium text-muted-foreground">Preview</span>
            </header>
            <div className="flex-1 overflow-hidden">
              <CodePreviewPanel
                blocks={previewBlocks}
                onClose={() => setShowPreviewPanel(false)}
              />
            </div>
          </div>
        )}
        <div className={`flex flex-col flex-1 min-w-0 ${showPreviewPanel ? "hidden sm:flex" : ""}`}>
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
                · {currentProviderName}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <SettingsDialog />
            </div>
          </header>

          <div className="flex-1 overflow-y-auto">
            {hydrated && (!activeChat || activeChat.messages.length === 0) ? (
              <ChatEmpty onSuggestion={handleSuggestion} />
            ) : (
              <ChatMessages
                messages={activeChat?.messages ?? []}
                isGenerating={isGenerating}
                streamingContent={streamingContent}
                reasoningContent={reasoningContent}
                onPreview={() => setShowPreviewPanel(true)}
                userName={userName}
                userAvatar={userAvatar}
                modelLabel={currentModelLabel}
              />
            )}
          </div>

          <div className="border-t p-4 shrink-0 bg-background">
            <ChatInput
              onSend={handleSend}
              onStop={handleStop}
              onModelChange={handleModelChange}
              isGenerating={isGenerating}
              initialMode={activeChat?.mode ?? "text"}
              disabled={!hydrated}
            />
          </div>
        </div>

        {showPreviewPanel && previewBlocks.length > 0 && (
          <ResizablePanel defaultWidth={480} minWidth={320} maxWidth={800}>
            <div className="hidden sm:flex flex-col h-full">
              <CodePreviewPanel
                blocks={previewBlocks}
                onClose={() => setShowPreviewPanel(false)}
              />
            </div>
          </ResizablePanel>
        )}
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
