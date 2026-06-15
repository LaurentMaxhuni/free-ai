"use client"

import { Settings as SettingsIcon } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export function SettingsDialog() {
  return (
    <Link href="/settings">
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        aria-label="Settings"
        className="cursor-pointer"
      >
        <SettingsIcon className="size-4" />
      </Button>
    </Link>
  )
}
