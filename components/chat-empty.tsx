"use client"

import { Sparkles, MessageSquare, ImageIcon } from "lucide-react"
import type { ChatMode } from "@/lib/ai"

type Props = {
  onSuggestion: (suggestion: string, mode: ChatMode) => void
}

const textSuggestions = [
  "Explain quantum computing in simple terms",
  "Write a short story about a time traveler",
  "Help me draft a professional email",
  "Tell me some tips for learning a new language",
]

const imageSuggestions = [
  "A cozy cabin in the mountains at sunset",
  "A futuristic city skyline at night",
  "An astronaut floating through a nebula",
  "A vintage cafe with warm lighting",
]

export function ChatEmpty({ onSuggestion }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-5">
      <div className="size-16! rounded-full bg-primary/10 flex items-center justify-center mb-5">
        <Sparkles className="size-8 text-primary" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-center">
        How can I help you today?
      </h2>
      <p className="text-muted-foreground mt-2 text-center max-w-md">
        Chat for free or generate stunning images. No limits, no signup fees.
      </p>

      <div className="mt-10 w-full max-w-2xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <MessageSquare className="size-3.5" />
            Try a prompt
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {textSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestion(suggestion, "text")}
                className="p-4 rounded-full border bg-card/50 text-sm text-left hover:bg-muted/60 hover:border-foreground/20 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground mb-3">
            <ImageIcon className="size-3.5" />
            Or generate an image
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {imageSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => onSuggestion(suggestion, "image")}
                className="p-4 rounded-full border bg-card/50 text-sm text-left hover:bg-muted/60 hover:border-foreground/20 transition-colors cursor-pointer"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
