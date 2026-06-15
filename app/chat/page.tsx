import { ChatView } from "@/components/chat-view"
import { ThemeScope } from "@/components/theme-scope"

export const dynamic = "force-dynamic"

const ChatPage = () => {
  return (
    <ThemeScope>
      <ChatView />
    </ThemeScope>
  )
}

export default ChatPage
