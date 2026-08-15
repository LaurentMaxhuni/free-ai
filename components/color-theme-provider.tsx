"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

type ThemeCtx = { theme: string; setTheme: (t: string) => void }
const ThemeContext = createContext<ThemeCtx>({ theme: "default", setTheme: () => {} })

export function ColorThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState("default")

  useEffect(() => {
    try {
      const raw = localStorage.getItem("free-ai:settings")
      if (!raw) return
      const settings = JSON.parse(raw)
      if (settings.colorTheme && settings.colorTheme !== "default") {
        // This effect hydrates an external localStorage value after mount.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setThemeState(settings.colorTheme)
      }
    } catch {}
  }, [])

  const setTheme = useCallback((t: string) => {
    setThemeState(t)
  }, [])

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useThemeColor() {
  return useContext(ThemeContext)
}
