import { NextResponse } from "next/server"
import { z } from "zod"
import { getFirestore } from "firebase-admin/firestore"
import { getAdminApp } from "@/lib/server/admin"

export const runtime = "nodejs"

const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(1).max(200),
  message: z.string().trim().min(1).max(10_000),
})

const RATE_WINDOW_MS = 60 * 60 * 1000
const MAX_SUBMISSIONS_PER_WINDOW = 5
const submissions = new Map<string, { count: number; resetAt: number }>()

function allowed(ip: string): boolean {
  const now = Date.now()
  const current = submissions.get(ip)
  if (!current || current.resetAt <= now) {
    submissions.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (current.count >= MAX_SUBMISSIONS_PER_WINDOW) return false
  current.count += 1
  return true
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown"
  if (!allowed(ip)) {
    return NextResponse.json(
      { error: "Too many messages. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }
  const parsed = contactSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete all fields with valid values." }, { status: 400 })
  }

  try {
    await getFirestore(getAdminApp()).collection("contactMessages").add({
      ...parsed.data,
      createdAt: Date.now(),
      source: "contact-form",
    })
    return NextResponse.json({ ok: true }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "We could not send your message. Please try again." }, { status: 500 })
  }
}
