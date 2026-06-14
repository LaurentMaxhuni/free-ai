"use client"

import { useEffect, useRef, useState, type KeyboardEvent, type DragEvent, type ChangeEvent } from "react"
import { Send, Square, MessageSquare, Image as ImageIcon, Paperclip, X, FileText, FileCode, FileImage, Globe } from "lucide-react"
import type { ChatMode, FileAttachment } from "@/lib/ai"
import { readFileAsAttachment } from "@/lib/ai"
import { Button } from "@/components/ui/button"
import { ModelSelector } from "@/components/model-selector"
import { cn } from "@/lib/utils"

type Props = {
  onSend: (content: string, mode: ChatMode, searchEnabled?: boolean, attachments?: FileAttachment[]) => void
  onStop?: () => void
  isGenerating: boolean
  initialMode?: ChatMode
  disabled?: boolean
}

const MAX_HEIGHT = 200

const ICONS: Record<string, typeof Paperclip> = {
  image: FileImage,
  text: FileText,
  code: FileCode,
  pdf: FileText,
}

export function ChatInput({
  onSend,
  onStop,
  isGenerating,
  initialMode = "text",
  disabled = false,
}: Props) {
  const [value, setValue] = useState("")
  const [mode, setMode] = useState<ChatMode>(initialMode)
  const [searchEnabled, setSearchEnabled] = useState(false)
  const [attachments, setAttachments] = useState<FileAttachment[]>([])
  const [dragOver, setDragOver] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMode(initialMode)
  }, [initialMode])

  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = "auto"
    ta.style.height = `${Math.min(ta.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  const handleFiles = async (files: FileList) => {
    const results: FileAttachment[] = []
    for (const file of Array.from(files)) {
      const attachment = await readFileAsAttachment(file)
      if (attachment) results.push(attachment)
    }
    if (results.length > 0) {
      setAttachments((prev) => [...prev, ...results])
    }
  }

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      handleFiles(files)
    }
    event.target.value = ""
  }

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(true)
  }

  const handleDragLeave = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setDragOver(false)
    const files = event.dataTransfer.files
    if (files.length > 0) handleFiles(files)
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSend = () => {
    const trimmed = value.trim()
    if ((!trimmed && attachments.length === 0) || isGenerating || disabled) return
    onSend(trimmed, mode, searchEnabled, attachments.length > 0 ? attachments : undefined)
    setValue("")
    setAttachments([])
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
      <div className="flex items-center gap-1 mb-2 flex-wrap">
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
        <ModelSelector mode={mode} />
        <div className="flex-1" />
        <button
          type="button"
          onClick={() => setSearchEnabled((v) => !v)}
          disabled={disabled || mode === "image"}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-colors cursor-pointer active:scale-[0.97]",
            searchEnabled
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground"
          )}
          aria-pressed={searchEnabled}
          aria-label="Toggle web search"
        >
          <Globe className={cn("size-3.5", searchEnabled && "animate-pulse")} />
          Search
        </button>
      </div>

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachments.map((att, i) => {
            const Icon = ICONS[att.type] ?? Paperclip
            return (
              <div
                key={i}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full bg-muted border"
              >
                <Icon className="size-3.5 text-muted-foreground" />
                <span className="max-w-[120px] truncate">{att.name}</span>
                <button
                  type="button"
                  onClick={() => removeAttachment(i)}
                  className="text-muted-foreground hover:text-foreground cursor-pointer ml-0.5"
                  aria-label={`Remove ${att.name}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <div
        className={cn(
          "relative rounded-3xl border bg-muted/30 focus-within:ring-2 focus-within:ring-ring/50 transition-all",
          dragOver && "ring-2 ring-primary border-dashed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={dragOver ? "Drop files here..." : placeholder}
          rows={1}
          disabled={disabled}
          aria-label="Chat message"
          role="textbox"
          className="w-full bg-transparent border-0 outline-none resize-none px-5 py-3.5 pr-28 text-sm placeholder:text-muted-foreground flex"
          style={{ maxHeight: MAX_HEIGHT }}
        />
        <div className="absolute right-2 bottom-2 flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isGenerating}
            className="size-8 rounded-full text-muted-foreground hover:text-foreground"
            aria-label="Attach file"
          >
            <Paperclip className="size-4" />
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.html,.css,.js,.ts,.jsx,.tsx,.py,.json,.csv,.md,.pdf,.xml,.yml,.yaml,.toml,.sh,.sql,.rs,.go,.java,.c,.cpp,.rb,.php,.swift,.kt,.scala"
            onChange={handleFilePick}
            className="hidden"
          />
          {isGenerating ? (
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              onClick={onStop}
              className="size-8 rounded-full"
              aria-label="Stop generating"
            >
              <Square className="size-3.5 fill-current" />
            </Button>
          ) : (
            <Button
              type="button"
              size="icon-sm"
              onClick={handleSend}
              disabled={(!value.trim() && attachments.length === 0) || disabled}
              className="size-8 rounded-full"
              aria-label="Send message"
            >
              <Send className="size-3.5" />
            </Button>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground text-center mt-2">
        Free.ai can make mistakes. Verify important information.
      </p>
    </div>
  )
}
