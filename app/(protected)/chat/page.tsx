"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AI_Prompt, { MODEL_ICONS } from "@/components/kokonutui/ai-prompt";
import NewChat from "@/components/new-chat";
import { cn } from "@/lib/utils";
import { Bot, Check, Copy } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const chatId = crypto.randomUUID();
  const router = useRouter();
  const pathname = usePathname();
  const query = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(query.toString());
      params.set(name, value);
      return params.toString();
    },
    [query]
  );

  
  const handleSend = (input: string, model: string) => {
    const text = input.trim();
    if (!text) {
      return;
    }

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };
    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Got it. Here's a stubbed response for: ${text}`,
      model,
    };

    setMessages((prev) => [...prev, userMessage, assistantMessage]);

    if (messages.length == 1) {
      router.push(pathname + "?" + createQueryString("chatId", chatId));
    }
  };

  const handleCopy = async (message: Message) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedId(message.id);
      window.setTimeout(() => {
        setCopiedId((current) => (current === message.id ? null : current));
      }, 1500);
    } catch {
      // Ignore clipboard errors silently.
    }
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return <NewChat onSend={handleSend} />;
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              <div
                className={cn(
                  "group relative max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <div className="flex items-start gap-2">
                  {message.role === "assistant" && message.model ? (
                    <span className="mt-0.5 shrink-0 text-foreground/70">
                      {MODEL_ICONS[message.model] ?? (
                        <Bot className="h-4 w-4 opacity-60" />
                      )}
                    </span>
                  ) : null}
                  <div className="min-w-0 flex-1">{message.content}</div>
                </div>
                <button
                  type="button"
                  aria-label="Copy message"
                  onClick={() => handleCopy(message)}
                  className={cn(
                    "absolute -top-2 -right-2 rounded-full border bg-background p-1 text-foreground/70 opacity-0 shadow-sm transition group-hover:opacity-100"
                  )}
                >
                  {copiedId === message.id ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl px-6">
          <AI_Prompt onSend={handleSend} containerClassName="w-full py-4" />
        </div>
      </div>
    </div>
  );
};

export default Chat;
