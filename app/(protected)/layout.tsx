import { ChatAuthGuard } from "@/components/chat-auth-guard";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return <ChatAuthGuard>{children}</ChatAuthGuard>;
}