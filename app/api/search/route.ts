import { NextResponse } from "next/server"
import { z } from "zod"
import { AuthError, verifyRequest } from "@/lib/server/verify-auth"

const querySchema = z.object({
  query: z.string().trim().min(1).max(500),
})

const RATE_WINDOW_MS = 60_000
const MAX_REQUESTS_PER_WINDOW = 20
const rateLimits = new Map<string, { resetAt: number; count: number }>()

function decodeEntities(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x60;/g, "`")
    .replace(/&#x2F;/g, "/")
}

function extractUrl(ddgUrl: string): string {
  const match = ddgUrl.match(/uddg=([^&]+)/)
  return match ? decodeURIComponent(match[1]) : ddgUrl
}

function takeRateLimit(uid: string): boolean {
  const now = Date.now()
  const current = rateLimits.get(uid)
  if (!current || current.resetAt <= now) {
    rateLimits.set(uid, { resetAt: now + RATE_WINDOW_MS, count: 1 })
    return true
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) return false
  current.count += 1
  return true
}

async function searchDuckDuckGo(query: string): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const response = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })
  if (!response.ok) throw new Error(`DuckDuckGo returned ${response.status}`)
  const html = await response.text()

  const linkRe = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi
  const links: string[] = []
  const titles: string[] = []
  const snippets: string[] = []

  let match: RegExpExecArray | null
  while ((match = linkRe.exec(html)) !== null) {
    links.push(match[1])
    titles.push(decodeEntities(match[2].replace(/<[^>]+>/g, "").trim()))
  }
  while ((match = snippetRe.exec(html)) !== null) {
    snippets.push(decodeEntities(match[1].replace(/<[^>]+>/g, "").trim()))
  }

  const results: string[] = []
  for (let i = 0; i < Math.min(links.length, 5); i += 1) {
    results.push(
      `${i + 1}. ${titles[i] || "Untitled"}\n   URL: ${extractUrl(links[i])}\n   ${snippets[i] || ""}`
    )
  }
  return results.join("\n\n")
}

export async function POST(request: Request) {
  let decoded
  try {
    decoded = await verifyRequest(request)
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status })
    throw error
  }

  if (!takeRateLimit(decoded.uid)) {
    return NextResponse.json(
      { error: "Search rate limit exceeded. Try again in a minute." },
      { status: 429, headers: { "Retry-After": "60" } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = querySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Query is required and must be a string of 500 characters or fewer." }, { status: 400 })
  }

  try {
    const results = await searchDuckDuckGo(parsed.data.query)
    return NextResponse.json({ results })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Search failed"
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
