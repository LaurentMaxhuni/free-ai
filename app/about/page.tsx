import type { Metadata } from "next"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn about Free.ai — the free AI platform created by Laurent Maxhuni. Our mission is to make artificial intelligence accessible to everyone, for free.",
  alternates: {
    canonical: "https://free-ai-lm.vercel.app/about",
  },
  openGraph: {
    title: "About | Free AI Chat & Tools",
    description:
      "Learn about Free.ai — the free AI platform created by Laurent Maxhuni. Our mission is to make AI accessible to everyone, for free.",
  },
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-dvh">
        <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">About Free.ai</h1>
        <p className="text-muted-foreground mb-10">
          Making AI accessible to everyone, for free.
        </p>

        <div className="space-y-8 text-sm leading-relaxed text-muted-foreground">
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Our Mission</h2>
            <p>
              Free.ai was built with a simple belief: artificial intelligence should be accessible to
              everyone, regardless of budget. We aggregate multiple free AI providers into a single,
              easy-to-use interface so you can chat, generate images, and explore the capabilities of
              modern AI without reaching for your wallet.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">What We Offer</h2>
            <ul className="space-y-2 list-disc pl-5">
              <li><strong className="text-foreground">Multi-Provider Chat</strong> &mdash; Access models from Pollinations.ai, Puter, Ollama, Groq, OpenRouter, and Hugging Face all from one interface.</li>
              <li><strong className="text-foreground">Image Generation</strong> &mdash; Create images using Flux and Hugging Face models with simple text prompts.</li>
              <li><strong className="text-foreground">File Uploads</strong> &mdash; Attach images and documents for AI-powered analysis and processing.</li>
              <li><strong className="text-foreground">Code Preview</strong> &mdash; Generate HTML, CSS, and JavaScript and preview it live, right in the browser.</li>
              <li><strong className="text-foreground">Web Search</strong> &mdash; Give the AI access to real-time web information for more accurate and current responses.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Our Technology</h2>
            <p>
              Free.ai is built with Next.js 16, React, Tailwind CSS, and Firebase. We use
              server-sent events (SSE) for real-time streaming responses, and our architecture
              supports multiple AI provider backends through a unified API layer.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Our Commitment</h2>
            <p>
              We are committed to keeping Free.ai free. We don&apos;t hide features behind paywalls,
              we don&apos;t limit your usage with arbitrary quotas, and we don&apos;t sell your data.
              Free.ai is funded through voluntary support and operates on a lean infrastructure to
              minimize costs.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground tracking-tight">Created by Laurent Maxhuni</h2>
            <p>
              Free.ai was created by <strong className="text-foreground">Laurent Maxhuni</strong>, a developer
              and AI enthusiast committed to making artificial intelligence accessible to everyone. The
              project was born from the belief that cost should never be a barrier to using cutting-edge
              AI technology.
            </p>
            <p>
              Laurent built Free.ai to aggregate free AI providers into a single seamless interface,
              eliminating the need to juggle multiple accounts, API keys, and pricing tiers. The result
              is a platform where anyone — from students to professionals — can leverage the power of
              free AI for chat, image generation, and more.
            </p>
          </section>
        </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
