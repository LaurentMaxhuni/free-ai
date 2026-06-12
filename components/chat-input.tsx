"use client"

import { useEffect, useRef, useState, type KeyboardEvent } from "react"
import { Send, Square, MessageSquare, Image as ImageIcon } from "lucide-react"
import type { ChatMode } from "@/lib/ai"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Props = {
  onSend: (content: string, mode: ChatMode) => void
  onStop?: () => void
  isGenerating: boolean
  initialMode?: ChatMode
  disabled?: boolean
}

const MAX_HEIGHT = 200

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  initialMode = "text",
  disabled = false,
}: Props) {
  const [value, setValue] = useState("")
  const [mode, setMode] = useState<ChatMode>(initialMode)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isGenerating || disabled) return
    onSend(trimmed, mode)
    setValue("")
    requestAnimationFrame(() => {
      const ta = textareaRef.current
      if (ta) ta.style.height = "auto"
    })
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      handleSend()
    }
  }

  const placeholder =
    mode === "text" ? "Message Free.ai..." : "Describe the image you want..."

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="flex items-center gap-1 mb-2">
        <button
          type="button"
          onClick={() => setMode("text")}
          disabled={disabled || isGenerating}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer active:scale-[0.97]",
            mode === "text"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={mode === "text"}
          aria-label="Chat mode"
        >
          <MessageSquare className="size-3.5" />
          Chat
        </button>
        <button
          type="button"
          onClick={() => setMode("image")}
          disabled={disabled || isGenerating}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer active:scale-[0.97]",
            mode === "image"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={mode === "image"}
          aria-label="Image mode"
        >
          <ImageIcon className="size-3.5" />
          Image
        </button>
      </div>

      <div className="relative rounded-3xl border bg-muted/30 focus-within:ring-2 focus-within:ring-ring/50 transition-all">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={1}
          disabled={disabled}
          aria-label="Chat message"
          role="textbox"
          className="w-full bg-transparent border-0 outline-none resize-none px-5 py-3.5 pr-14 text-sm placeholder:text-muted-foreground flex rounded-full"
          style={{ maxHeight: MAX_HEIGHT }}
        />
        {isGenerating ? (
          <Button
            type="button"
            size="icon-sm"
            variant="destructive"
            onClick={onStop}
            className="absolute right-2 bottom-2 size-8 rounded-full"
            aria-label="Stop generating"
          >
            <Square className="size-3.5 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon-sm"
            onClick={handleSend}
            disabled={!value.trim() || disabled}
            className="absolute right-2 bottom-2 size-8 rounded-full"
            aria-label="Send message"
          >
            <Send className="size-3.5" />
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Free.ai can make mistakes. Verify important information.
      </p>
    </div>
  )
}
