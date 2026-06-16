import type { Metadata } from "next"
import { ChatView } from "@/components/chat-view"
import { ThemeScope } from "@/components/theme-scope"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Chat",
  description:
    "Chat with free AI models from multiple providers in one interface. Generate text, images, and more — no limits.",
  alternates: {
    canonical: "https://free-ai-lm.vercel.app/chat",
  },
}

const ChatPage = () => {
  return (
    <ThemeScope>
      <ChatView />
    </ThemeScope>
  )
}

export default ChatPage
