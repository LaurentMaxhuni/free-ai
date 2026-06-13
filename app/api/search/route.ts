import { NextResponse } from "next/server"

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
  const m = ddgUrl.match(/uddg=([^&]+)/)
  return m ? decodeURIComponent(m[1]) : ddgUrl
}

async function searchDuckDuckGo(query: string): Promise<string> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`
  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  })
  if (!res.ok) throw new Error(`DuckDuckGo returned ${res.status}`)
  const html = await res.text()

  const linkRe = /<a[^>]+class="result__a"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi
  const snippetRe = /<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi
  const links: string[] = []
  const titles: string[] = []
  const snippets: string[] = []

  let m: RegExpExecArray | null
  while ((m = linkRe.exec(html)) !== null) {
    links.push(m[1])
    titles.push(decodeEntities(m[2].replace(/<[^>]+>/g, "").trim()))
  }
  while ((m = snippetRe.exec(html)) !== null) {
    snippets.push(decodeEntities(m[1].replace(/<[^>]+>/g, "").trim()))
  }

  const results: string[] = []
  for (let i = 0; i < Math.min(links.length, 5); i++) {
    results.push(
      `${i + 1}. ${titles[i] || "Untitled"}\n   URL: ${extractUrl(links[i])}\n   ${snippets[i] || ""}`
    )
  }
  return results.join("\n\n")
}

export async function POST(request: Request) {
  try {
    const { query } = (await request.json()) as { query: string }
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Query is required" }, { status: 400 })
    }
    const results = await searchDuckDuckGo(query.slice(0, 500))
    return NextResponse.json({ results })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Search failed"
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
