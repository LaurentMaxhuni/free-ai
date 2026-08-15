"use client"

import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
  children: ReactNode
  attribute?: string
  defaultTheme?: Theme
  enableSystem?: boolean
  disableTransitionOnChange?: boolean
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "dark" | "light"
}

const ThemeProviderContext = createContext<ThemeProviderState | undefined>(undefined)

function ThemeProvider({
  children,
  attribute = "class",
  defaultTheme = "system",
  enableSystem = true,
  disableTransitionOnChange = false,
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)
  const [resolvedTheme, setResolvedTheme] = useState<"dark" | "light">(
    defaultTheme === "system" ? "light" : defaultTheme
  )
  const themeRef = useRef<Theme>(defaultTheme)

  const applyTheme = useCallback((newTheme: Theme) => {
    const resolved = newTheme === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      : newTheme
    setResolvedTheme(resolved)
    const root = document.documentElement
    if (disableTransitionOnChange) {
      root.classList.add("transition-none")
      setTimeout(() => root.classList.remove("transition-none"), 0)
    }
    if (attribute === "class") {
      root.classList.remove("light", "dark")
      root.classList.add(resolved)
    } else {
      root.setAttribute(attribute, resolved)
    }
  }, [attribute, disableTransitionOnChange])

  const setTheme = useCallback((newTheme: Theme) => {
    themeRef.current = newTheme
    setThemeState(newTheme)
    try { localStorage.setItem("theme", newTheme) } catch {}
    applyTheme(newTheme)
  }, [applyTheme])

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    const initial = stored || defaultTheme
    themeRef.current = initial
    // Hydrate the persisted external preference after the client mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initial)
    applyTheme(initial)

    if (enableSystem) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      const handler = () => {
        if (themeRef.current === "system") applyTheme("system")
      }
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ThemeProviderContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

function useTheme() {
  const context = useContext(ThemeProviderContext)
  if (!context) throw new Error("useTheme must be used within a ThemeProvider")
  return context
}

export { ThemeProvider, useTheme }
