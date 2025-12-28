import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Logo } from "./logo"
import Link from "next/link"

export function CtaBlock() {
  return (
    <section className="w-full my-14">
      <div className="mx-auto w-full max-w-5xl px-4">
        <Card className="overflow-hidden p-0">
          <CardContent className="relative p-8 sm:p-10">
            {/* soft background */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary/10 via-transparent to-muted/40"
            />

            <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
              <div className="max-w-xl">
                <p className="text-sm text-muted-foreground">Ready when you are</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
                  Unleash your creativity with <Logo className="inline-block w-auto h-8 mb-1 text-3xl" />
                </h2>
                <Button
                  nativeButton={false}
                  className="mt-4"
                  render={<Link href="/login" />}
                >
                  Get Started
                </Button>
              </div>


              <Logo className="text-7xl" />
              {/* <div className="flex w-full flex-col gap-3 sm:w-auto sm:min-w-90">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    type="email"
                    placeholder="you@domain.com"
                    className="h-11"
                    aria-label="Email address"
                  />
                  <Button className="h-11">Get started</Button>
                </div>

                <div className="flex gap-2">
                  <Button variant="secondary" className="h-10 w-full sm:w-auto">
                    View docs
                  </Button>
                  <Button variant="ghost" className="h-10 w-full sm:w-auto">
                    See examples
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  No spam. One email when there’s something actually useful.
                </p>
              </div> */}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
