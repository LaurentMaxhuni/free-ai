import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { ColorThemeProvider } from "@/components/color-theme-provider";
import { PWARegister } from "@/components/pwa-register";
import "./globals.css";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://free-ai-lm.vercel.app"),
  title: {
    default: "Free AI — Chat, Image Generation & AI Tools | Free.ai",
    template: "%s | Free AI Chat & Tools",
  },
  description:
    "Free AI chat and image generation with no limits and no credit card required. Generate stunning images with Flux, chat with multiple AI models like GPT and Claude, and create content for free at Free.ai — the best free AI platform.",
  keywords: [
    "free ai",
    "free ai chat",
    "ai image generator free",
    "free ai tools",
    "free ai image generator",
    "ai chat free",
    "free ai writing assistant",
    "ai text generator free",
    "free ai platform",
    "free ai laurent maxhuni",
    "laurent maxhuni free ai",
    "generative ai free",
    "free artificial intelligence",
    "free ai online",
    "no cost ai",
  ],
  authors: [{ name: "Free.ai" }, { name: "Laurent Maxhuni" }],
  creator: "Laurent Maxhuni",
  publisher: "Free.ai",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://free-ai-lm.vercel.app",
    siteName: "Free.ai",
    title: "Free AI — Chat, Image Generation & AI Tools | Free.ai",
    description:
      "Free AI chat and image generation with no limits and no credit card required. Generate stunning images with Flux, chat with multiple AI models, and create content for free.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Free.ai — Free AI Chat, Image Generation & Tools",
      },
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Free.ai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free AI — Chat, Image Generation & AI Tools | Free.ai",
    description:
      "Free AI chat and image generation with no limits and no credit card required. Generate stunning images with Flux, chat with multiple AI models, and create content for free.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/icon.svg", type: "image/svg+xml", sizes: "512x512" },
    ],
    shortcut: "/favicon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    title: "Free.ai",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f11" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${outfit.variable}`} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Free.ai",
              url: "https://free-ai-lm.vercel.app",
              description:
                "Free AI chat and image generation with no limits. Chat with multiple AI models, generate images with Flux, and create content for free.",
              applicationCategory: "AIApplication",
              operatingSystem: "Web",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              author: {
                "@type": "Person",
                name: "Laurent Maxhuni",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Free.ai",
              url: "https://free-ai-lm.vercel.app",
              description:
                "Free AI chat, image generation, and content creation platform.",
            }),
          }}
        />
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <ColorThemeProvider>
            {children}
            <PWARegister />
          </ColorThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
