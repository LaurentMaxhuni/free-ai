"use client";

import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ComponentProps } from "react";

export const NavMenu = ({
  orientation,
  className,
  ...props
}: ComponentProps<typeof NavigationMenu>) => (
  <NavigationMenu orientation={orientation} className={className} {...props}>
    <NavigationMenuList
      className={cn(
        orientation === "vertical" && "-ms-2 flex-col items-start justify-start"
      )}
    >
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="#home" scroll={true} />}>Home</NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="#features" scroll={true} />}>Features</NavigationMenuLink>
      </NavigationMenuItem>
      <NavigationMenuItem>
        <NavigationMenuLink className={navigationMenuTriggerStyle()} render={<Link href="#faq" scroll={true} />}>FAQ</NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
);
