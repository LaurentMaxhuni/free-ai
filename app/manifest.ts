import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Free.ai - Free AI Chat, Image Generation, and More",
    short_name: "Free.ai",
    description: "Free AI Chat, Image Generation, and More",
    start_url: "/",
    display: "standalone",
    background_color: "#000000",
    theme_color: "#33ffcc",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
