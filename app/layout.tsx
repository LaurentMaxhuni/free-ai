import type { Metadata } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
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
    default: "Free.ai | Unlock Your Creativity with AI",
    template: "%s | Free.ai",
  },
  description:
    "Experience the power of AI-driven creativity with Free.ai. Generate stunning images, craft compelling text, and explore endless possibilities with our cutting-edge AI tools — completely free, no limits.",
  keywords: [
    "free ai",
    "ai image generator",
    "ai text generator",
    "free ai tools",
    "ai creativity",
    "ai assistant",
    "ai chat",
    "free ai image generation",
    "ai writing assistant",
  ],
  authors: [{ name: "Free.ai" }],
  creator: "Free.ai",
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
    title: "Free.ai | Unlock Your Creativity with AI",
    description:
      "Generate stunning images and craft compelling text with our cutting-edge AI tools — completely free, no limits.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Free.ai — Unlock Your Creativity with AI",
      },
      {
        url: "/free.ai.png",
        width: 512,
        height: 512,
        alt: "Free.ai",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free.ai | Unlock Your Creativity with AI",
    description:
      "Generate stunning images and craft compelling text with our cutting-edge AI tools — completely free, no limits.",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
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
    <html lang="en" className={outfit.variable} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
