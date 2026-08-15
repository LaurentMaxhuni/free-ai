import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{ path: string[] }>
}

const firebaseProjectId =
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID

function firebaseAuthHost(): string | null {
  if (!firebaseProjectId || !/^[a-z0-9-]+$/i.test(firebaseProjectId)) return null
  return `${firebaseProjectId}.firebaseapp.com`
}

async function proxyAuthRequest(request: Request, context: RouteContext) {
  const host = firebaseAuthHost()
  if (!host) {
    return NextResponse.json({ error: "Firebase Auth is not configured." }, { status: 503 })
  }

  const { path } = await context.params
  const requestUrl = new URL(request.url)
  const upstreamUrl = new URL(`https://${host}/__/auth/${path.join("/")}`)
  upstreamUrl.search = requestUrl.search

  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("content-length")
  headers.delete("connection")
  headers.set("accept-encoding", "identity")

  const body = request.method === "GET" || request.method === "HEAD"
    ? undefined
    : await request.arrayBuffer()

  const upstreamResponse = await fetch(upstreamUrl, {
    method: request.method,
    headers,
    body,
    cache: "no-store",
    redirect: "manual",
  })

  const responseHeaders = new Headers(upstreamResponse.headers)
  responseHeaders.delete("content-encoding")
  responseHeaders.delete("content-length")
  responseHeaders.delete("transfer-encoding")

  return new NextResponse(upstreamResponse.body, {
    status: upstreamResponse.status,
    headers: responseHeaders,
  })
}

export async function GET(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context)
}

export async function HEAD(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context)
}

export async function POST(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context)
}

export async function OPTIONS(request: Request, context: RouteContext) {
  return proxyAuthRequest(request, context)
}
