"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type Props = {
  children: React.ReactNode
  defaultWidth?: number
  minWidth?: number
  maxWidth?: number
  onWidthChange?: (width: number) => void
}

export function ResizablePanel({
  children,
  defaultWidth = 480,
  minWidth = 280,
  maxWidth = 960,
  onWidthChange,
}: Props) {
  const [width, setWidth] = useState(defaultWidth)
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)
  const panelRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelRef.current?.getBoundingClientRect().width ?? width
    document.body.style.cursor = "col-resize"
    document.body.style.userSelect = "none"
  }, [width])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return
    const delta = e.clientX - startX.current
    const newWidth = Math.min(maxWidth, Math.max(minWidth, startWidth.current - delta))
    setWidth(newWidth)
    onWidthChange?.(newWidth)
  }, [minWidth, maxWidth, onWidthChange])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false
    document.body.style.cursor = ""
    document.body.style.userSelect = ""
  }, [])

  useEffect(() => {
    window.addEventListener("mousemove", handleMouseMove)
    window.addEventListener("mouseup", handleMouseUp)
    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleMouseUp)
    }
  }, [handleMouseMove, handleMouseUp])

  return (
    <div
      ref={panelRef}
      className="flex shrink-0 border-l bg-background"
      style={{ width }}
    >
      <div
        className="w-1.5 shrink-0 cursor-col-resize hover:bg-border active:bg-border transition-colors -ml-px relative z-10"
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  )
}
