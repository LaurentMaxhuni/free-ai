"use client"

import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Mail, Send, CheckCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fields, setFields] = useState({ name: "", email: "", subject: "", message: "" })

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(typeof data?.error === "string" ? data.error : "Could not send your message.")
      }
      setSubmitted(true)
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Could not send your message.")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <>
        <Navbar />
        <main className="pt-16 min-h-dvh">
          <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <CheckCircle className="size-12 text-primary mx-auto mb-4" />
          <h1 className="text-3xl font-bold tracking-tight mb-2">Message Sent</h1>
          <p className="text-muted-foreground">
            Thanks for reaching out. We&apos;ll get back to you as soon as possible.
          </p>
          <a href="/contact" className="mt-4 inline-flex text-sm text-primary underline underline-offset-2 hover:text-primary/80 transition-colors">
            Send another message
          </a>
          </div>
        </main>
        <Footer />
      </>
      )
    }

  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-dvh">
        <div className="max-w-xl mx-auto px-4 py-16">
        <div className="flex items-center gap-3 mb-2">
          <Mail className="size-6 text-primary" />
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Contact Us</h1>
        </div>
        <p className="text-muted-foreground mb-8">
          Have a question, suggestion, or need help? Send us a message.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" required placeholder="Your name" value={fields.name} disabled={submitting} onChange={(event) => setFields((prev) => ({ ...prev, name: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required placeholder="you@example.com" value={fields.email} disabled={submitting} onChange={(event) => setFields((prev) => ({ ...prev, email: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" name="subject" required placeholder="How can we help?" value={fields.subject} disabled={submitting} onChange={(event) => setFields((prev) => ({ ...prev, subject: event.target.value }))} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea id="message" name="message" rows={5} required placeholder="Tell us more..." value={fields.message} disabled={submitting} onChange={(event) => setFields((prev) => ({ ...prev, message: event.target.value }))} />
          </div>

          {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" disabled={submitting} className="w-full gap-2 cursor-pointer">
            <Send className="size-4" />
            {submitting ? "Sending..." : "Send Message"}
          </Button>
        </form>
      </div>
      </main>
      <Footer />
    </>
  )
}
