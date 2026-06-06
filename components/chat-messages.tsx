"use client"

import { useEffect, useRef, useState } from "react"
import { Check, Copy, ImageIcon, Sparkles, User } from "lucide-react"
import { getImageUrl, isImageMessage, type ChatMessage } from "@/lib/ai"
import { cn } from "@/lib/utils"
import { MarkdownRenderer } from "@/components/markdown-renderer"

type Props = {
  messages: ChatMessage[]
  isGenerating: boolean
  streamingContent?: string
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
      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
      aria-label={copied ? "Copied" : "Copy message"}
    >
      {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
    </button>
  )
}

function ImageBubble({ url }: { url: string }) {
  const [error, setError] = useState(false)

  if (error) {
    return (
      <div className="rounded-2xl border bg-muted px-4 py-8 text-sm text-muted-foreground max-w-md">
        Image failed to load.
      </div>
    )
  }

  return (
    <div className="rounded-2xl overflow-hidden border bg-muted max-w-lg">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt="AI generated"
        className="w-full h-auto block"
        loading="lazy"
        onError={() => setError(true)}
      />
    </div>
  )
}

function MessageBubble({ message, isStreaming }: { message: ChatMessage; isStreaming?: boolean }) {
  if (isImageMessage(message)) {
    const url = getImageUrl(message)
    if (!url) return null
    return <ImageBubble url={url} />
  }

  if (message.role === "assistant") {
    return (
      <div className="rounded-2xl bg-muted/60 px-4 py-2.5 max-w-2xl">
        <div className="text-sm leading-relaxed break-words prose prose-sm dark:prose-invert prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 max-w-none">
          <MarkdownRenderer content={message.content} />
          {isStreaming && (
            <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/60 animate-pulse rounded-sm align-text-bottom" />
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl bg-muted/60 px-4 py-2.5 max-w-2xl">
      <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">
        {message.content}
      </p>
    </div>
  )
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl bg-muted/60 w-fit">
      <span
        className="size-2 rounded-full bg-foreground/40 animate-bounce"
        style={{ animationDelay: "0ms" }}
      />
      <span
        className="size-2 rounded-full bg-foreground/40 animate-bounce"
        style={{ animationDelay: "150ms" }}
      />
      <span
        className="size-2 rounded-full bg-foreground/40 animate-bounce"
        style={{ animationDelay: "300ms" }}
      />
    </div>
  )
}

export function ChatMessages({ messages, isGenerating, streamingContent }: Props) {
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" })
  }, [messages, isGenerating, streamingContent])

  const hasStreamContent = isGenerating && streamingContent && streamingContent.length > 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {messages.map((message, index) => {
        const isUser = message.role === "user"
        const isAssistantImage =
          message.role === "assistant" && isImageMessage(message)
        return (
          <div
            key={index}
            className={cn(
              "group flex gap-3",
              isUser ? "flex-row-reverse" : "flex-row"
            )}
          >
            <div
              className={cn(
                "shrink-0 size-8 rounded-full flex items-center justify-center",
                isUser
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-primary"
              )}
              aria-hidden
            >
              {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
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
                <span>{isUser ? "You" : "Free.ai"}</span>
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
              <MessageBubble message={message} />
            </div>
          </div>
        )
      })}

      {hasStreamContent ? (
        <div className="group flex gap-3">
          <div
            className="shrink-0 size-8 rounded-full bg-muted text-primary flex items-center justify-center"
            aria-hidden
          >
            <Sparkles className="size-4" />
          </div>
          <div className="flex flex-col min-w-0 items-start">
            <div className="text-xs text-muted-foreground mb-1 px-1">Free.ai</div>
            <div className="rounded-2xl bg-muted/60 px-4 py-2.5 max-w-2xl">
              <div className="text-sm leading-relaxed break-words prose prose-sm dark:prose-invert prose-p:my-1 prose-pre:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 max-w-none">
                <MarkdownRenderer content={streamingContent} />
                <span className="inline-block w-2 h-4 ml-0.5 bg-foreground/60 animate-pulse rounded-sm align-text-bottom" />
              </div>
            </div>
          </div>
        </div>
      ) : isGenerating ? (
        <div className="group flex gap-3">
          <div
            className="shrink-0 size-8 rounded-full bg-muted text-primary flex items-center justify-center"
            aria-hidden
          >
            <Sparkles className="size-4 animate-pulse" />
          </div>
          <div className="flex flex-col min-w-0">
            <div className="text-xs text-muted-foreground mb-1 px-1">Free.ai</div>
            <TypingIndicator />
          </div>
        </div>
      ) : null}

      <div ref={endRef} />
    </div>
  )
}
