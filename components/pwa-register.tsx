"use client"

import { useEffect } from "react"

export function PWARegister() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return

    if (process.env.NODE_ENV !== "production") {
      // A service worker must not cache Turbopack's changing development
      // chunks. Remove workers/caches left by an earlier production run so
      // the current client bundle can boot and auth handlers can execute.
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) void registration.unregister()
      })
      if ("caches" in window) {
        void caches.keys().then((keys) => Promise.all(
          keys
            .filter((key) => key.startsWith("free-ai-"))
            .map((key) => caches.delete(key))
        ))
      }
      return
    }

    const register = () => void navigator.serviceWorker.register("/sw.js")
    if (document.readyState === "complete") register()
    else window.addEventListener("load", register, { once: true })
    return () => window.removeEventListener("load", register)
  }, [])

  return null
}
