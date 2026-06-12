"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Check, Copy, Eye, Code, Maximize2, Minimize2 } from "lucide-react"

type CodeBlockProps = {
  language?: string
  children: string
}

function CodeBlock({ language, children }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const codeRef = useRef<HTMLElement>(null)

  const lang = (language ?? "").toLowerCase()
  const isPreviewable = ["html", "css", "javascript", "js", "htm", "jsx", "tsx"].includes(lang)

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(children)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be blocked */
    }
  }, [children])

  const previewContent = useMemo(() => {
    if (!isPreviewable) return null
    if (lang === "css") {
      return { type: "css" as const, content: children }
    }
    if (lang === "html" || lang === "htm") {
      return { type: "html" as const, content: children }
    }
    if (lang === "javascript" || lang === "js" || lang === "jsx" || lang === "tsx") {
      return { type: "js" as const, content: children }
    }
    return null
  }, [isPreviewable, lang, children])

  return (
    <div className="group/code relative my-3 rounded-full border bg-muted/80 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {lang || "code"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isPreviewable && (
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              aria-label={showPreview ? "Show code" : "Show preview"}
            >
              {showPreview ? <Code className="size-3" /> : <Eye className="size-3" />}
              {showPreview ? "Code" : "Preview"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-1.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {showPreview && previewContent ? (
        <CodePreview type={previewContent.type} content={previewContent.content} />
      ) : (
        <div className={expanded ? "max-h-[80vh] overflow-auto" : "max-h-[400px] overflow-auto"}>
          <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
            <code ref={codeRef} className={`language-${lang || "text"}`}>
              {children}
            </code>
          </pre>
        </div>
      )}
    </div>
  )
}

function CodePreview({
  type,
  content,
}: {
  type: "html" | "css" | "js"
  content: string
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const htmlContent = useMemo(() => {
    if (type === "html") return content
    if (type === "css") {
      return `<!DOCTYPE html>
<html><head><style>${content}</style></head>
<body><div class="preview-container">
  <div class="box">Sample Box</div>
  <button>Button</button>
  <input placeholder="Input field" />
  <p>Paragraph text</p>
  <a href="#">Link</a>
  <ul><li>Item 1</li><li>Item 2</li></ul>
</div></body></html>`
    }
    if (type === "js") {
      return `<!DOCTYPE html>
<html><head><style>
body { font-family: monospace; padding: 16px; background: Canvas; color: CanvasText; }
#output { white-space: pre-wrap; }
.log { color: CanvasText; }
.error { color: #f44747; }
.warn { color: #cca700; }
.info { color: #569cd6; }
</style></head>
<body><div id="output"></div>
<script>
const __output = document.getElementById('output');
const __origLog = console.log;
const __origError = console.error;
const __origWarn = console.warn;
const __origInfo = console.info;
function __append(cls, args) {
  const div = document.createElement('div');
  div.className = cls;
  div.textContent = args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ');
  __output.appendChild(div);
}
console.log = (...a) => { __append('log', a); __origLog(...a); };
console.error = (...a) => { __append('error', a); __origError(...a); };
console.warn = (...a) => { __append('warn', a); __origWarn(...a); };
console.info = (...a) => { __append('info', a); __origInfo(...a); };
window.onerror = (msg) => { __append('error', [msg]); };
try {
${content}
} catch(e) { __append('error', [e.message]); }
</script></body></html>`
    }
    return ""
  }, [type, content])

  return (
    <div className="relative bg-background">
      <iframe
        ref={iframeRef}
        srcDoc={htmlContent}
        className="w-full h-[300px] border-0"
        sandbox="allow-scripts"
        title="Code preview"
      />
    </div>
  )
}

function InlineCode({ children }: { children: React.ReactNode }) {
  return (
    <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-muted text-primary text-[0.85em] font-mono font-medium">
      {children}
    </code>
  )
}

type MarkdownRendererProps = {
  content: string
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        code({ className, children }) {
          const match = /language-(\w+)/.exec(className || "")
          const isInline = !match && !String(children).includes("\n")

          if (isInline) {
            return <InlineCode>{children}</InlineCode>
          }

          return (
            <CodeBlock language={match?.[1]}>
              {String(children).replace(/\n$/, "")}
            </CodeBlock>
          )
        },
        p({ children }) {
          return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>
        },
        h1({ children }) {
          return <h1 className="text-xl font-bold mb-3 mt-6 first:mt-0">{children}</h1>
        },
        h2({ children }) {
          return <h2 className="text-lg font-bold mb-2 mt-5 first:mt-0">{children}</h2>
        },
        h3({ children }) {
          return <h3 className="text-base font-bold mb-2 mt-4 first:mt-0">{children}</h3>
        },
        ul({ children }) {
          return <ul className="list-disc pl-6 mb-3 space-y-1">{children}</ul>
        },
        ol({ children }) {
          return <ol className="list-decimal pl-6 mb-3 space-y-1">{children}</ol>
        },
        li({ children }) {
          return <li className="leading-relaxed">{children}</li>
        },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-4 border-primary/30 pl-4 my-3 italic text-muted-foreground">
              {children}
            </blockquote>
          )
        },
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
            >
              {children}
            </a>
          )
        },
        table({ children }) {
          return (
            <div className="overflow-x-auto my-3 rounded-lg border">
              <table className="w-full text-sm">{children}</table>
            </div>
          )
        },
        thead({ children }) {
          return <thead className="bg-muted/50">{children}</thead>
        },
        th({ children }) {
          return <th className="px-3 py-2 text-left font-semibold border-b">{children}</th>
        },
        td({ children }) {
          return <td className="px-3 py-2 border-b">{children}</td>
        },
        hr() {
          return <hr className="my-4 border-muted" />
        },
        strong({ children }) {
          return <strong className="font-bold">{children}</strong>
        },
        em({ children }) {
          return <em className="italic">{children}</em>
        },
      }}
    >
      {content}
    </ReactMarkdown>
  )
}
