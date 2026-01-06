"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AI_Prompt, { MODEL_ICONS } from "@/components/kokonutui/ai-prompt";
import NewChat from "@/components/new-chat";
import { cn } from "@/lib/utils";
import { Bot, Check, Copy } from "lucide-react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";

// type Message = {
//   id: string;
//   role: "user" | "assistant";
//   content: string;
//   model?: string;
//   label?: string;
// };

const Chat = () => {
  // const [messages, setMessages] = useState<Message[]>([]);
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

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    })
  })

  const handleSend = async (input: string, model: string, label: string) => {
    const text = input.trim();
    if (!text) return;

    // const res = await fetch("/api/chat", {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({ model, prompt: text }),
    // });
    // const data = await res.json();

    // const userMessage: Message = { id: crypto.randomUUID(), role: "user", content: text };
    // const assistantMessage: Message = {
    //   id: crypto.randomUUID(),
    //   role: "assistant",
    //   content: data.text,
    //   model,
    //   label,
    // };

    // setMessages((prev) => [...prev, userMessage, assistantMessage]);

    // sendMessage(
    //   { role: "user", content: text },
    //   { body: { model, label } }
    // );


    // sendMessage(
    //   { role: "user", text: text },
    //   { body: { model, label } }
    // )

    sendMessage(
      { role: "user", parts: [{ type: "text", text }] },
      { body: { model, label } }
    );


  };

  const handleCopy = async (message) => {
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
                {message.parts.map((part, index) => {
                  if (part.type !== "text") return null;

                  console.log(part.text)

                  return <span key={index}>
                    {part.text}
                  </span>
                })}
                <div className="flex items-start gap-2">
                  {message.role === "assistant" && (<Button
                    type="button"
                    aria-label="Copy message"
                    variant="secondary"
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
                  </Button>)}
                </div>
              </div>
            </div>
          ))}
          {status === "streaming" && (
            <div className="text-xs text-muted-foreground">Assistant is typing...</div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>
      <div className="bg-background/80 backdrop-blur-sm">
        <div className="mx-auto w-full max-w-3xl px-6">
          <AI_Prompt onSend={handleSend} containerClassName="w-full py-4" />
        </div>
      </div>
    </div>
  );
};

export default Chat;
