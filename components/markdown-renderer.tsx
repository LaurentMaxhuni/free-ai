"use client"

import { memo, useCallback, useMemo, useRef, useState, useSyncExternalStore } from "react"
import { motion } from "motion/react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { Highlight, themes } from "prism-react-renderer"
import { Check, Copy, Eye, Code, ExternalLink, Maximize2, Minimize2 } from "lucide-react"

const DARK_MODE_SUPPORTED_LANGUAGES = [
  "markup", "html", "xml", "svg", "mathml",
  "css", "clike", "javascript", "js", "jsx", "tsx", "typescript", "ts",
  "bash", "shell", "sh", "powershell", "ps1", "batch",
  "c", "cpp", "csharp", "cs", "dotnet",
  "go", "graphql", "gql",
  "haskell", "hs",
  "java", "json", "kotlin", "kt", "kts",
  "latex", "tex", "less", "lisp", "lua",
  "makefile", "markdown", "md",
  "matlab", "objectivec", "objc",
  "perl", "php", "python", "py", "r",
  "ruby", "rb", "rust", "rs", "sass", "scss", "scala",
  "sql", "swift", "tcl",
  "toml", "yaml", "yml", "wasm",
  "diff", "docker", "dockerfile", "ignore", "gitignore",
  "regex", "uri", "url",
]

function subscribeDarkMode(cb: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)")
  mq.addEventListener("change", cb)
  return () => mq.removeEventListener("change", cb)
}

function getDarkMode() {
  if (typeof window === "undefined") return true
  return (
    document.documentElement.classList.contains("dark") ||
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
}

export type CodePreviewContent = {
  type: "html" | "css" | "js"
  content: string
  language: string
}

type CodeBlockProps = {
  language?: string
  children: string
  onPreview?: () => void
}

function getPrismLang(lang: string): string {
  const map: Record<string, string> = {
    sh: "bash", shell: "bash",
    ps1: "powershell", powershell: "powershell",
    py: "python", python: "python",
    rb: "ruby", ruby: "ruby",
    rs: "rust", rust: "rust",
    ts: "typescript", typescript: "typescript",
    tsx: "tsx", jsx: "jsx",
    js: "javascript", javascript: "javascript",
    cs: "csharp", "c#": "csharp", csharp: "csharp",
    cpp: "cpp", "c++": "cpp", "cc": "cpp", "cxx": "cpp", "hpp": "cpp",
    h: "c", c: "c",
    go: "go", golang: "go",
    kt: "kotlin", kts: "kotlin", kotlin: "kotlin",
    swift: "swift",
    scala: "scala",
    hs: "haskell", haskell: "haskell",
    lua: "lua",
    php: "php",
    r: "r",
    sql: "sql",
    graphql: "graphql", gql: "graphql",
    yml: "yaml", yaml: "yaml",
    toml: "toml",
    md: "markdown", markdown: "markdown",
    html: "html", htm: "html", xml: "xml", svg: "svg",
    css: "css", scss: "scss", sass: "sass", less: "less",
    json: "json",
    diff: "diff",
    docker: "docker", dockerfile: "docker",
    makefile: "makefile", make: "makefile",
    gitignore: "ignore", ignore: "ignore",
    wasm: "wasm",
    latex: "latex", tex: "latex",
    matlab: "matlab",
    perl: "perl",
    lisp: "lisp",
    tcl: "tcl",
    batch: "batch",
    clike: "clike",
    objectivec: "objectivec", objc: "objectivec",
    regex: "regex",
  }
  return map[lang] ?? lang
}

const CodeBlock = memo(function CodeBlock({ language, children, onPreview }: CodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const isDark = useSyncExternalStore(subscribeDarkMode, getDarkMode, () => true)

  const lang = (language ?? "").toLowerCase()
  const prismLang = DARK_MODE_SUPPORTED_LANGUAGES.includes(getPrismLang(lang)) ? getPrismLang(lang) : "clike"
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
    <div className="group/code relative my-3 rounded-3xl border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">
            {lang || "code"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {isPreviewable && previewContent && (
              <button
                type="button"
                onClick={() => {
                  if (onPreview) {
                    onPreview()
                  } else {
                    setShowPreview((v) => !v)
                  }
                }}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              aria-label="Open preview"
            >
              <Eye className="size-3" />
              Preview
            </button>
          )}
          {isPreviewable && onPreview && (
            <button
              type="button"
              onClick={() => setShowPreview((v) => !v)}
              className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
              aria-label={showPreview ? "Show code" : "Show inline preview"}
            >
              {showPreview ? <Code className="size-3" /> : <ExternalLink className="size-3" />}
              {showPreview ? "Code" : "Inline"}
            </button>
          )}
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-xs px-1.5 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <Minimize2 className="size-3" /> : <Maximize2 className="size-3" />}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors cursor-pointer"
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
        <motion.div
          initial={false}
          animate={{ height: expanded ? "80vh" : "400px" }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <Highlight code={children.trimEnd()} language={prismLang} theme={isDark ? themes.nightOwl : themes.oneLight}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre className={`${className} p-4 overflow-x-auto text-sm leading-relaxed h-full`} style={style}>
                {tokens.map((line, i) => (
                  <div key={i} {...getLineProps({ line })}>
                    {line.map((token, key) => (
                      <span key={key} {...getTokenProps({ token })} />
                    ))}
                  </div>
                ))}
              </pre>
            )}
          </Highlight>
        </motion.div>
      )}
    </div>
  )
})

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
  onPreview?: () => void
}

export function MarkdownRenderer({ content, onPreview }: MarkdownRendererProps) {
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
            <CodeBlock language={match?.[1]} onPreview={onPreview}>
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

const BLOCK_RE = /```(\S+)?\s*(?:\n|$)([\s\S]*?)```/g

export function extractCodeBlocks(markdown: string): CodePreviewContent[] {
  const blocks: CodePreviewContent[] = []
  BLOCK_RE.lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = BLOCK_RE.exec(markdown)) !== null) {
    const lang = (match[1] ?? "").toLowerCase()
    const content = match[2].trim()
    if (!content) continue
    if (["html", "htm"].includes(lang)) {
      blocks.push({ type: "html", content, language: lang })
    } else if (lang === "css") {
      blocks.push({ type: "css", content, language: lang })
    } else if (["javascript", "js", "jsx", "tsx"].includes(lang)) {
      blocks.push({ type: "js", content, language: lang })
    }
  }
  return blocks
}
