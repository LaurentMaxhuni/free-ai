export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-6xl">📡</div>
      <h1 className="text-2xl font-bold">You&apos;re Offline</h1>
      <p className="text-muted-foreground max-w-md">
        Please check your internet connection and try again. Some previously
        loaded content may still be available.
      </p>
    </div>
  )
}
