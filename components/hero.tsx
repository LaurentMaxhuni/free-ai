import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, CirclePlay } from "lucide-react";
import { BackgroundPattern } from "@/components/background-pattern";
import Link from "next/link";

export default function Hero() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <BackgroundPattern />

      <div className="relative z-10 text-center max-w-3xl">
        <Badge variant="secondary" className="rounded-full py-1 border-border" render={<Link href="#" />}>Completely free. No Limits. Login Now. <ArrowUpRight className="ml-1 size-4" /></Badge>
        <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl lg:text-7xl md:leading-[1.2] font-semibold tracking-tighter">
          Welcome to the place where the sky&apos;s the limit.
        </h1>
        <p className="mt-6 md:text-lg text-foreground/80">
          Explore free.ai and it&apos;s unlimited capabilites. Generate stunning images, craft compelling text and unlock your creativity with our cutting-edge AI tools.
        </p>
        <div className="mt-12 flex items-center justify-center gap-4">
          <Button
            nativeButton={false}
            size="lg"
            className="rounded-full text-base cursor-pointer"
            render={<Link href="/login" />}
          >
            Get Started <ArrowUpRight className="h-5! w-5!" />
          </Button>
        </div>
      </div>
    </div>
  );
}
