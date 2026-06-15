"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

interface Tab {
  value: string
  label: string
  badge?: React.ReactNode
}

interface ScrollableTabsProps {
  tabs: Tab[]
  value: string
  onValueChange: (value: string) => void
  children: (value: string) => React.ReactNode
  className?: string
}

function ScrollableTabs({ tabs, value, onValueChange, children, className }: ScrollableTabsProps) {
  return (
    <Tabs value={value} onValueChange={(v) => v && onValueChange(v)} className={className}>
      <TabsList className="w-full overflow-x-auto flex-nowrap justify-start mb-3">
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} className="shrink-0 gap-1.5">
            {tab.label}
            {tab.badge ? (
              <span className="inline-flex items-center">{tab.badge}</span>
            ) : null}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {children(tab.value)}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export { ScrollableTabs }
export type { Tab, ScrollableTabsProps }
