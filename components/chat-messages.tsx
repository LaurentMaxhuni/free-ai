"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Check, Copy, ChevronDown, ImageIcon, Sparkles, User, FileText, FileCode } from "lucide-react"
import { getImageUrl, isImageMessage, type ChatMessage, type FileAttachment } from "@/lib/ai"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/markdown-renderer"

type Props = {
  messages: ChatMessage[]
  isGenerating?: boolean
  streamingContent?: string
  reasoningContent?: string
  onPreview?: () => void
  userName?: string
  userAvatar?: string
  modelLabel?: string
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked */
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="opacity-60 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground cursor-pointer"
      aria-label={copied ? "Copied" : "Copy message"}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function ImageBubble({ url }: { url: string }) {
  const [error, setError] = useState<string | null>(null)

  if (error) {
    return (
      <div className="rounded-2xl border bg-muted px-4 py-6 text-sm max-w-md">
        <p className="text-destructive font-medium mb-1">Image failed to load</p>
        <p className="text-muted-foreground text-xs break-words">{error}</p>
      </div>
    )
  }

  const handleDownload = () => {
    const a = document.createElement("a")
    a.href = url
    a.download = `free-ai-image-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return (
    <div className="relative group rounded-2xl overflow-hidden border bg-muted max-w-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="AI generated"
        className="w-full h-auto block"
        loading="lazy"
        onError={() => setError(url.startsWith("data:") ? "The image data could not be rendered." : "Failed to load from external source.")}
      />
      <button
        type="button"
        onClick={handleDownload}
        className="absolute top-2 right-2 size-8 flex items-center justify-center rounded-lg bg-black/50 text-white opacity-0 group-hover:opacity-100 hover:bg-black/70 transition-opacity cursor-pointer"
        title="Download image"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      </button>
    </div>
  )
}

function MessageBubble({ message, isStreaming, onPreview }: { message: ChatMessage; isStreaming?: boolean; onPreview?: () => void }) {
  if (isImageMessage(message)) {
    const url = getImageUrl(message)
    if (!url) return null
    return <ImageBubble url={url} />
  }

  if (message.role === "assistant") {
    return (
      <div className="rounded-2xl bg-muted/60 px-4 py-2.5 max-w-2xl">
        <div className="text-sm leading-relaxed break-words overflow-x-hidden prose prose-sm dark:prose-invert prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 max-w-none">
          <MarkdownRenderer content={message.content} onPreview={onPreview} />
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/60 animate-pulse motion-reduce:animate-none rounded-sm align-text-bottom" />
          )}
        </div>
      </div>
    )
  }

  const userAttachments = (message as ChatMessage & { attachments?: FileAttachment[] }).attachments

  return (
    <div className="rounded-2xl bg-muted/60 px-4 py-2.5 max-w-2xl space-y-2">
      {userAttachments && userAttachments.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {userAttachments.map((att, i) => {
            if (att.type === "image") {
              return (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={att.data}
                  alt={att.name}
                  className="max-w-[200px] max-h-[200px] rounded-lg object-cover border"
                />
              )
            }
            const Icon = att.type === "code" ? FileCode : FileText
            return (
              <div key={i} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-muted border">
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="max-w-[160px] truncate">{att.name}</span>
                <span className="text-muted-foreground">
                  ({(att.size / 1024).toFixed(1)} KB)
                </span>
              </div>
            )
          })}
        </div>
      )}
      {message.content && (
        <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
          {message.content}
        </p>
      )}
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-muted/60 w-fit" role="status" aria-label="AI is typing">
      <span
        className="size-2 rounded-full bg-foreground/40 animate-bounce motion-reduce:animate-none"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="size-2 rounded-full bg-foreground/40 animate-bounce motion-reduce:animate-none"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="size-2 rounded-full bg-foreground/40 animate-bounce motion-reduce:animate-none"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  )
}

function ThinkingBlock({ content }: { content: string }) {
  const [open, setOpen] = useState(true)

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      transition={{ duration: 0.3 }}
      className="mb-2"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full cursor-pointer"
      >
        <span className="relative flex items-center gap-1.5">
          <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
          Thinking
        </span>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="size-3" />
        </motion.div>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="reasoning"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 text-xs leading-relaxed text-muted-foreground/80 bg-muted/40 rounded-lg p-3 border-l-2 border-amber-500/40 whitespace-pre-wrap">
              {content}
              <span className="inline-block w-1.5 h-3 ml-0.5 bg-amber-500/60 animate-pulse motion-reduce:animate-none rounded-sm align-text-bottom" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export function ChatMessages({ messages, isGenerating, streamingContent, reasoningContent, onPreview, userName = "", userAvatar = "", modelLabel }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isGenerating, streamingContent])

  const hasStreamContent = isGenerating && streamingContent && streamingContent.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 overflow-x-hidden">
      {messages.map((message, index) => {
        const isUser = message.role === "user"
        const isAssistantImage =
          message.role === "assistant" && isImageMessage(message)
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className={cn(
              "group flex gap-3",
              isUser ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "shrink-0 size-8 rounded-full flex items-center justify-center overflow-hidden",
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary"
              )}
              aria-hidden
            >
              {isUser && userAvatar ? (
                <img src={userAvatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
              ) : isUser ? (
                <User className="size-4" />
              ) : (
                <Sparkles className="size-4" />
              )}
            </div>
            <div
              className={cn(
                "flex flex-col min-w-0",
                isUser ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "text-xs text-muted-foreground mb-1 flex items-center gap-2 px-1",
                  isUser ? "flex-row-reverse" : "flex-row"
                )}
              >
                <span>{isUser ? (userName || "You") : modelLabel ? `${modelLabel}` : "Free.ai"}</span>
                {isAssistantImage ? (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider">
                    <ImageIcon className="size-3" />
                    Image
                  </span>
                ) : null}
                {!isUser && message.content && !isAssistantImage ? (
                  <CopyButton content={message.content} />
                ) : null}
              </div>
              <MessageBubble message={message} onPreview={onPreview} />
            </div>
          </motion.div>
        )
      })}

      {hasStreamContent ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="group flex gap-3"
        >
          <div
            className="shrink-0 size-8 rounded-full bg-muted text-primary flex items-center justify-center"
            aria-hidden
          >
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 items-start">
            <div className="text-xs text-muted-foreground mb-1 px-1">{modelLabel ?? "Free.ai"}</div>
            {reasoningContent ? <ThinkingBlock content={reasoningContent} /> : null}
            <div className="rounded-2xl bg-muted/60 px-4 py-2.5 max-w-2xl">
              <div className="text-sm leading-relaxed break-words overflow-x-hidden prose prose-sm dark:prose-invert prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 max-w-none">
                <MarkdownRenderer content={streamingContent} onPreview={onPreview} />
                <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/60 animate-pulse motion-reduce:animate-none rounded-sm align-text-bottom" />
              </div>
            </div>
          </div>
        </motion.div>
      ) : isGenerating ? (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="group flex gap-3"
        >
          <div
            className="shrink-0 size-8 rounded-full bg-muted text-primary flex items-center justify-center"
            aria-hidden
          >
            <Sparkles className="size-4 animate-pulse motion-reduce:animate-none" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-xs text-muted-foreground mb-1 px-1">{modelLabel ?? "Free.ai"}</div>
            <TypingIndicator />
          </div>
        </motion.div>
      ) : null}

      <div ref={endRef} />
    </div>
  )
}
