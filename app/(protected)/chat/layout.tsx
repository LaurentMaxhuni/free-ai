import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import ChatSidebar from "@/components/chat-sidebar"

export default function Layout({ children }: { children: React.ReactNode }) {

  return (
    <SidebarProvider>
      <ChatSidebar />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
