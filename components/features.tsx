"use client";

import SpotlightCard from "@/components/SpotlightCard"
import {
  MessageSquare,
  Image,
  Globe,
  FileUp,
  Code,
  Infinity,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Multi-Provider Chat",
    description:
      "Access models from Pollinations.ai, Puter, Ollama, Groq, and OpenRouter — all from one clean interface. Switch providers on the fly.",
  },
  {
    icon: Image,
    title: "Free Image Generation",
    description:
      "Create images from text prompts using Flux and Hugging Face models. No credits, no subscriptions, no limits.",
  },
  {
    icon: Globe,
    title: "Web Search",
    description:
      "Give the AI access to real-time search results from DuckDuckGo for more accurate and current information.",
  },
  {
    icon: FileUp,
    title: "File Uploads & Vision",
    description:
      "Upload images and documents for AI-powered analysis. Attach files to your messages and let the models read them.",
  },
  {
    icon: Code,
    title: "Live Code Preview",
    description:
      "Generate HTML, CSS, and JavaScript and preview it instantly. Perfect for prototyping UI components and layouts.",
  },
  {
    icon: Infinity,
    title: "Completely Free",
    description:
      "No paywalls, no usage quotas, no credit card required. Free.ai aggregates free tiers from multiple providers so you never hit a wall.",
  },
];

const Features = () => {
  return (
    <div className="min-h-dvh flex items-center justify-center px-6 py-12">
      <div className="max-w-(--breakpoint-lg) w-full py-10 px-6">
        <h2 className="text-4xl md:text-[2.5rem] md:leading-[1.2] font-semibold tracking-[-0.03em] sm:max-w-xl text-pretty">
          What Free.ai Actually Does
        </h2>
        <p className="mt-2 text-muted-foreground text-lg sm:text-xl">
          A free, multi-provider AI chat interface with image generation, web search, and more.
        </p>
        <div className="mt-10 w-full mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
          {features.map((feature) => (
            <SpotlightCard
              key={feature.title}
              className="flex flex-col rounded-3xl overflow-hidden shadow-none border-2! border-border/40! bg-card/50! hover:bg-card/70! transition-colors duration-300"
              spotlightColor="rgba(0, 229, 255, 0.15)"
            >
              <feature.icon className="size-8 text-primary" />
              <h4 className="mt-4 text-xl font-semibold tracking-tight">
                {feature.title}
              </h4>
              <p className="mt-2 text-muted-foreground text-[17px]">
                {feature.description}
              </p>
            </SpotlightCard>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Features;
