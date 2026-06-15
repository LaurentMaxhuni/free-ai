"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"

import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

export function ModeToggle() {
  const { setTheme } = useTheme()

  return (
    <div className="bottom-4 right-4 fixed">
      <DropdownMenu>
        <DropdownMenuTrigger
          type="button"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-lg" }),
            "cursor-pointer"
          )}
        >
          <Sun className="h-[1.4rem] w-[1.4rem] scale-100 rotate-0 transition-transform motion-reduce:transition-none dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.4rem] w-[1.4rem] scale-0 rotate-90 transition-transform motion-reduce:transition-none dark:scale-100 dark:rotate-0" />
          <span className="sr-only">Toggle theme</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="top">
          <DropdownMenuItem onClick={() => setTheme("light")} className="cursor-pointer">
            Light
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("dark")} className="cursor-pointer">
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setTheme("system")} className="cursor-pointer">
            System
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
