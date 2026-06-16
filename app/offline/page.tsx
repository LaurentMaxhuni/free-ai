import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Offline",
  description: "You're offline. Please check your internet connection and try again.",
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl" aria-hidden="true">&#x1F4E1;</div>
      <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
      <p className="text-muted-foreground max-w-md">
        Please check your internet connection and try again. Some previously
        loaded content may still be available.
      </p>
    </div>
  )
}
