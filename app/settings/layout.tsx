import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Manage your Free.ai account settings, AI providers, appearance preferences, and API keys.",
  alternates: {
    canonical: "https://free-ai-lm.vercel.app/settings",
  },
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
