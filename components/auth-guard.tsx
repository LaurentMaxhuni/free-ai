"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { onAuthStateChanged } from "firebase/auth"
import { auth } from "@/lib/firebase"

export function AuthGuard({ children }: { children: ReactNode }) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)

  useEffect(() => {
    if (!auth) return
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setAuthorized(true)
      } else {
        router.replace("/login")
      }
    })
    return () => unsubscribe()
  }, [router])

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div
          aria-label="Loading"
          className="size-8 rounded-full border-2 border-muted-foreground/30 border-t-primary animate-spin"
        />
      </div>
    )
  }

  return <>{children}</>
}
