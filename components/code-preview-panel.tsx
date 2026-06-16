"use client"

import { useMemo, useRef, type ComponentType, type SVGProps } from "react"
import { X, FileCode, FileType, Braces } from "lucide-react"
import type { CodePreviewContent } from "@/components/markdown-renderer"
import { Button } from "@/components/ui/button"

type Props = {
  blocks: CodePreviewContent[]
  onClose: () => void
}

function combineBlocks(blocks: CodePreviewContent[]): string {
  const htmlBlocks: string[] = []
  const cssBlocks: string[] = []
  const jsBlocks: string[] = []

  for (const b of blocks) {
    if (b.type === "html") htmlBlocks.push(b.content)
    else if (b.type === "css") cssBlocks.push(b.content)
    else if (b.type === "js") jsBlocks.push(b.content)
  }

  const standaloneHtml = htmlBlocks.filter((h) => /^<!DOCTYPE html/i.test(h.trim()))
  const fragmentHtml = htmlBlocks.filter((h) => !/^<!DOCTYPE html/i.test(h.trim()))

  if (standaloneHtml.length === 1 && fragmentHtml.length === 0 && cssBlocks.length === 0 && jsBlocks.length === 0) {
    return standaloneHtml[0]
  }

  const html = [...standaloneHtml.map((h) => h.replace(/^<!DOCTYPE html>[\s\S]*?<body[^>]*>([\s\S]*?)<\/body>[\s\S]*?<\/html>/i, "$1")), ...fragmentHtml].join("\n")
  const css = cssBlocks.join("\n")
  const js = jsBlocks.join("\n")
  const hasCss = css.trim().length > 0
  const hasJs = js.trim().length > 0

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
${hasCss ? `<style>\n${css}</style>` : ""}
</head>
<body>
${html || '<div id="root"></div>'}
${hasJs ? `<script>\n${js}\n</script>` : ""}
</body>
</html>`
}

const TYPE_ICONS: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  html: FileType,
  css: Braces,
  js: FileCode,
}

function TypeBadge({ type, count }: { type: string; count: number }) {
  const Icon = TYPE_ICONS[type] ?? FileCode
  return (
    <span className="flex items-center gap-1">
      <Icon className="size-3" />
      <span className="uppercase">{type}</span>
      <span className="text-muted-foreground/60">×{count}</span>
    </span>
  )
}

export function CodePreviewPanel({ blocks, onClose }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const stats = useMemo(() => {
    const counts = { html: 0, css: 0, js: 0 }
    for (const b of blocks) {
      if (b.type in counts) (counts as Record<string, number>)[b.type]++
    }
    return counts
  }, [blocks])

  const htmlContent = useMemo(() => {
    if (blocks.length === 0) return ""
    return combineBlocks(blocks)
  }, [blocks])

  if (blocks.length === 0) return null

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center justify-between px-4 py-2.5 border-b shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">Live Preview</span>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {Object.entries(stats).map(([type, count]) =>
              count > 0 ? <TypeBadge key={type} type={type} count={count} /> : null
            )}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
          aria-label="Close preview panel"
        >
          <X className="size-4" />
        </Button>
      </div>
      <div className="flex-1 overflow-hidden">
        <iframe
          ref={iframeRef}
          srcDoc={htmlContent}
          className="w-full h-full border-0"
          sandbox="allow-scripts"
          title="Preview"
        />
      </div>
    </div>
  )
}
