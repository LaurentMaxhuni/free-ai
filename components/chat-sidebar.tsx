"use client";
import React, { useState } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarRail, SidebarTrigger } from './ui/sidebar'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon, Search01FreeIcons } from '@hugeicons/core-free-icons'

const ChatSidebar = () => {
  const [chats, setChats] = useState<string[]>([]);
  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className="group-data-[collapsible=icon]:items-center">
        <div className="flex items-center justify-between group-data-[collapsible=icon]:justify-center">
          <Logo className="m-2 group-data-[collapsible=icon]:hidden" />
          <div className="relative hidden size-8 items-center justify-center group-data-[collapsible=icon]:flex">
            <span className="bg-sidebar-accent text-sidebar-accent-foreground flex size-8 items-center justify-center rounded-md text-sm font-semibold transition-opacity group-hover:opacity-0">
              f <span className="text-primary">a</span>
            </span>
            <SidebarTrigger className="absolute inset-0 opacity-0 pointer-events-none transition-opacity group-hover:opacity-100 group-hover:pointer-events-auto cursor-pointer" />
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden cursor-pointer" />
        </div>
        <Button
          variant="ghost"
          size="lg"
          aria-label="New Chat"
          className="items-center justify-start cursor-pointer group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <HugeiconsIcon icon={PencilEdit02Icon} strokeWidth={2} size={10} />
          <span className="group-data-[collapsible=icon]:hidden">New Chat</span>
        </Button>
        <Button
          variant="ghost"
          size="lg"
          aria-label="Search Chats"
          className="items-center justify-start cursor-pointer group-data-[collapsible=icon]:size-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
        >
          <HugeiconsIcon icon={Search01FreeIcons} strokeWidth={2} size={10} />
          <span className="group-data-[collapsible=icon]:hidden">Search Chats</span>
        </Button>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Your Chats</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chats.length > 0
                ?
                <SidebarMenuItem>

                </SidebarMenuItem>
                :
                <SidebarGroupLabel className="self-center text-md text-white">You have no chats.</SidebarGroupLabel>}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}

export default ChatSidebar
