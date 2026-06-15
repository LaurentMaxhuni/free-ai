"use client"

import { useThemeColor } from "./color-theme-provider"

export function ThemeScope({ children }: { children: React.ReactNode }) {
  const { theme } = useThemeColor()
  return <div className={theme !== "default" ? `theme-${theme}` : ""}>{children}</div>
}
