import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Get in touch with the Free.ai team. Have a question, suggestion, or need help? Send us a message and we'll get back to you.",
  alternates: {
    canonical: "https://free-ai-lm.vercel.app/contact",
  },
}

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
