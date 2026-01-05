"use client";
import React, { useState } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarRail, SidebarTrigger } from './ui/sidebar'
import { Logo } from './logo'
import { Button } from '@/components/ui/button'
import { HugeiconsIcon } from '@hugeicons/react'
import { PencilEdit02Icon, Search01FreeIcons } from '@hugeicons/core-free-icons'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarImage } from './ui/avatar';
import { ChevronUp, CreditCard, LogOut, User } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { redirect, useRouter } from 'next/navigation';
import { useAuth } from './auth-provider';

const ChatSidebar = () => {

  const router = useRouter();
  const [chats, setChats] = useState<string[]>([]);
  const { user, loading } = useAuth();

  if (loading || !user) {
    return null;
  }

  const signOutButton = () => {
    signOut(auth).then(() => {
      console.log('Sign out succesful!');
      router.push('/login');
    }).catch((error) => {
      console.log('Sign out failed!', error);
    })
  }

  return (
    <>
      <div className="fixed left-3 top-3 z-50 md:hidden">
        <SidebarTrigger className="bg-sidebar text-sidebar-foreground shadow-md" />
      </div>
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
          <SidebarMenu className='w-full'>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <SidebarMenuButton className='w-full py-7 cursor-pointer justify-start group-data-[collapsible=icon]:p-1! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0' />
                  }
                >
                  <Avatar className="group-data-[collapsible=icon]:size-6">
                    <AvatarImage src={user.photoURL ?? undefined} />
                  </Avatar>
                  <div className="flex min-w-0 flex-col leading-tight group-data-[collapsible=icon]:hidden">
                    <h1 className="truncate text-sm font-medium">{user.displayName}</h1>
                    <p className="text-muted-foreground truncate text-xs">{user.email}</p>
                  </div>
                  <ChevronUp className='ml-auto group-data-[collapsible=icon]:hidden' />
                </DropdownMenuTrigger>
                <DropdownMenuContent side='top' align='center' className="w-[calc(var(--anchor-width))]"
                >
                  <DropdownMenuItem className="cursor-pointer">
                    <User /> Account
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer">
                    <CreditCard /> Billing
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive cursor-pointer" onClick={() => signOutButton()}>
                    <LogOut /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  )
}

export default ChatSidebar
