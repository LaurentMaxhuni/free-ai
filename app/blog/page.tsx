import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"

const posts = [
  {
    slug: "getting-started-with-free-ai",
    title: "Getting Started with Free AI: A Beginner's Guide",
    excerpt: "Learn how to harness the power of free AI tools for text generation, image creation, and more — no credit card required.",
    date: "June 10, 2026",
    tags: ["Guides", "AI Basics"],
  },
  {
    slug: "best-free-ai-image-generators-2026",
    title: "Best Free AI Image Generators in 2026",
    excerpt: "Compare the top free AI image generation tools and discover how to create stunning visuals without spending a dime.",
    date: "June 5, 2026",
    tags: ["Image Generation", "Comparisons"],
  },
  {
    slug: "using-llms-effectively",
    title: "Using Large Language Models Effectively",
    excerpt: "Tips and techniques for getting better results from LLMs like GPT, Claude, and Gemini through prompt engineering.",
    date: "May 28, 2026",
    tags: ["LLMs", "Tips"],
  },
  {
    slug: "open-source-vs-closed-source-ai",
    title: "Open Source vs Closed Source AI Models",
    excerpt: "Explore the trade-offs between open and closed source AI models and how to choose the right one for your project.",
    date: "May 20, 2026",
    tags: ["Comparisons", "AI Models"],
  },
  {
    slug: "future-of-free-ai-tools",
    title: "The Future of Free AI Tools",
    excerpt: "What trends are shaping the landscape of free AI tools and what users can expect in the coming years.",
    date: "May 12, 2026",
    tags: ["Industry", "Trends"],
  },
]

export default function BlogPage() {
  return (
    <>
      <Navbar />
      <main className="pt-16 min-h-dvh">
        <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold tracking-tight mb-2">Blog</h1>
        <p className="text-muted-foreground mb-10">
          Tips, guides, and updates from the Free.ai team.
        </p>
        <div className="space-y-8">
          {posts.map((post) => (
            <article key={post.slug}>
              <Link href={`/blog/${post.slug}`} className="group block">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <time>{post.date}</time>
                    <span aria-hidden>&middot;</span>
                    <div className="flex gap-1.5">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-[10px] px-1.5 py-0">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
              <div className="mt-6 border-b" />
            </article>
          ))}
        </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
