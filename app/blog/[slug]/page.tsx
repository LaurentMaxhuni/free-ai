import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { notFound } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

type Post = {
  title: string
  date: string
  excerpt: string
  content: string
}

const posts: Record<string, Post> = {
  "getting-started-with-free-ai": {
    title: "Getting Started with Free AI: A Beginner's Guide",
    date: "June 10, 2026",
    excerpt:
      "Learn how to harness the power of free AI tools for text generation, image creation, and more — no credit card required.",
    content: `
      <p>Artificial intelligence is no longer a futuristic concept &mdash; it's a tool available to anyone with an internet connection. Free AI platforms have democratized access to powerful language models and image generators, putting creative and productivity tools in the hands of millions.</p>

      <h2>What You Can Do with Free AI</h2>
      <p>Free AI tools like Free.ai offer a range of capabilities:</p>
      <ul>
        <li><strong>Text Generation</strong> &mdash; Write articles, emails, code, poetry, and more with the help of large language models.</li>
        <li><strong>Image Generation</strong> &mdash; Create unique visuals from text descriptions using state-of-the-art diffusion models.</li>
        <li><strong>Conversational AI</strong> &mdash; Chat with AI assistants that can answer questions, brainstorm ideas, and help with problem-solving.</li>
      </ul>

      <h2>Choosing the Right Model</h2>
      <p>Different AI models excel at different tasks. For creative writing, models like GPT and Claude offer nuanced, coherent text. For technical tasks, specialized models may provide more accurate results. Free.ai gives you access to multiple providers so you can choose what works best for your use case.</p>

      <h2>Tips for Better Results</h2>
      <p>Getting the most out of AI tools often comes down to how you phrase your requests. Be specific, provide context, and don't hesitate to iterate. If the first result isn't what you expected, try rephrasing or adding more detail to your prompt.</p>

      <h2>Getting Started</h2>
      <p>Sign up for a Free.ai account, choose a provider and model, and start experimenting. The best way to learn is by doing &mdash; try generating a short story, creating a logo, or asking the AI to explain a complex topic in simple terms.</p>
    `,
  },
  "best-free-ai-image-generators-2026": {
    title: "Best Free AI Image Generators in 2026",
    date: "June 5, 2026",
    excerpt:
      "Compare the top free AI image generation tools and discover how to create stunning visuals without spending a dime.",
    content: `
      <p>AI image generation has evolved rapidly. In 2026, there are several excellent free options available, each with its own strengths. Here's a breakdown of what's out there and how Free.ai fits into the ecosystem.</p>

      <h2>What to Look For</h2>
      <p>When choosing a free AI image generator, consider image quality, generation speed, style variety, and usage limits. The best tools balance all four without requiring a subscription.</p>

      <h2>Flux by Black Forest Labs</h2>
      <p>Flux has become one of the most popular open-source image models. It produces high-quality images with impressive prompt adherence and style versatility. Through Free.ai, you can access Flux without any setup hassle.</p>

      <h2>Hugging Face Models</h2>
      <p>Hugging Face hosts thousands of community-trained image models. From photorealistic renders to anime-style art, there's a model for almost every aesthetic. Free.ai integrates with Hugging Face's inference API for easy access.</p>

      <h2>Tips for Great Images</h2>
      <p>Write detailed prompts that describe the subject, style, lighting, and composition. Reference artists or art movements for stylistic guidance. Experiment with different models to find the one that matches your vision.</p>
    `,
  },
  "using-llms-effectively": {
    title: "Using Large Language Models Effectively",
    date: "May 28, 2026",
    excerpt:
      "Tips and techniques for getting better results from LLMs like GPT, Claude, and Gemini through prompt engineering.",
    content: `
      <p>Large language models (LLMs) are powerful tools, but their output quality depends heavily on how you interact with them. Effective prompt engineering can dramatically improve results.</p>

      <h2>Be Specific</h2>
      <p>Instead of asking "Write a story," try "Write a 500-word science fiction story about a robot learning to paint." Specific constraints help the model understand exactly what you're looking for.</p>

      <h2>Provide Examples</h2>
      <p>Showing the model what you want (few-shot prompting) often yields better results than describing it. Include an example of the tone, format, or style you're aiming for.</p>

      <h2>Iterate and Refine</h2>
      <p>Rarely does the first output match exactly what you envisioned. Use follow-up prompts to refine: "Make it more formal," "Shorten this to two paragraphs," or "Add more technical detail."</p>

      <h2>Use System Instructions</h2>
      <p>With Free.ai's multi-provider support, you can leverage system-level instructions that guide the model's behavior throughout a conversation. Define the AI's role upfront for more consistent responses.</p>
    `,
  },
  "open-source-vs-closed-source-ai": {
    title: "Open Source vs Closed Source AI Models",
    date: "May 20, 2026",
    excerpt:
      "Explore the trade-offs between open and closed source AI models and how to choose the right one for your project.",
    content: `
      <p>The debate between open source and closed source AI models continues to shape the industry. Both approaches have passionate advocates and compelling arguments. Understanding the trade-offs helps you make informed choices.</p>

      <h2>Open Source Models</h2>
      <p>Models like Llama, Mistral, and Stable Diffusion are publicly available for anyone to use, modify, and study. Benefits include transparency, community innovation, and the ability to run models locally. Free.ai provides access to several open-source models through providers like Ollama and Groq.</p>

      <h2>Closed Source Models</h2>
      <p>Proprietary models like GPT-4, Claude, and Gemini are developed by companies and accessed through APIs. They often offer higher performance out of the box, better safety filtering, and dedicated infrastructure. Free.ai connects you to these through providers like Puter and OpenRouter.</p>

      <h2>Which Should You Choose?</h2>
      <p>For most users, the answer is: both. Use closed-source models for polished, production-ready tasks and open-source models for experimentation, customization, and cost-sensitive projects. Free.ai's multi-provider approach lets you switch seamlessly.</p>
    `,
  },
  "future-of-free-ai-tools": {
    title: "The Future of Free AI Tools",
    date: "May 12, 2026",
    excerpt:
      "What trends are shaping the landscape of free AI tools and what users can expect in the coming years.",
    content: `
      <p>The free AI landscape has changed dramatically over the past few years. What started as limited trials and demo APIs has evolved into robust platforms offering genuine utility at no cost. Here's where the industry is headed.</p>

      <h2>More Models, More Choice</h2>
      <p>The number of available AI models continues to grow. New players enter the market regularly, and existing providers release improved versions. Free platforms aggregate these options, giving users unprecedented choice.</p>

      <h2>Improved Quality</h2>
      <p>Open-source models are closing the gap with their proprietary counterparts. Models like Llama 4 and Flux demonstrate that free and open alternatives can compete with the best commercial offerings.</p>

      <h2>Multimodal Capabilities</h2>
      <p>The line between text, image, and audio AI continues to blur. Future free tools will seamlessly combine multiple modalities within a single interface, enabling richer interactions and creative workflows.</p>

      <h2>Sustainability</h2>
      <p>The biggest question facing free AI tools is sustainability. Advertising, API usage limits, and premium tiers are common models. Free.ai remains committed to providing generous free access while exploring sustainable funding approaches.</p>
    `,
  },
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = posts[slug]
  if (!post) return {}

  return {
    title: post.title,
    description: post.excerpt,
    alternates: {
      canonical: `https://free-ai-lm.vercel.app/blog/${slug}`,
    },
    openGraph: {
      title: `${post.title} | Free AI Blog`,
      description: post.excerpt,
      type: "article",
      publishedTime: new Date(post.date).toISOString(),
    },
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = posts[slug]

  if (!post) notFound()

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.date,
    author: {
      "@type": "Person",
      name: "Laurent Maxhuni",
    },
    publisher: {
      "@type": "Organization",
      name: "Free.ai",
    },
    url: `https://free-ai-lm.vercel.app/blog/${slug}`,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }}
      />
      <Navbar />
      <main className="pt-16 min-h-dvh">
        <div className="max-w-3xl mx-auto px-4 py-16">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="size-4" />
          Back to blog
        </Link>

        <article>
          <header className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              {post.title}
            </h1>
            <time className="text-sm text-muted-foreground">{post.date}</time>
          </header>

          <div
            className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
              prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:mb-4
              prose-ul:text-muted-foreground prose-ul:space-y-1
              prose-li:leading-relaxed
              prose-strong:text-foreground"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        </article>
      </div>
      </main>
      <Footer />
    </>
  )
}
