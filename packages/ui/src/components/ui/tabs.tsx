"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "radix-ui"

import { cn } from "@/lib/utils"

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("ui:flex ui:flex-col ui:gap-2", className)}
      {...props}
    />
  )
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "ui:bg-muted ui:text-muted-foreground/70 ui:inline-flex ui:w-fit ui:items-center ui:justify-center ui:rounded-md ui:p-0.5",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "ui:hover:text-muted-foreground ui:data-[state=active]:bg-background ui:data-[state=active]:text-foreground ui:focus-visible:border-ring ui:focus-visible:ring-ring/50 ui:inline-flex ui:items-center ui:justify-center ui:rounded-sm ui:px-3 ui:py-1.5 ui:text-sm ui:font-medium ui:whitespace-nowrap ui:transition-all ui:outline-none ui:focus-visible:ring-[3px] ui:disabled:pointer-events-none ui:disabled:opacity-50 ui:data-[state=active]:shadow-xs ui:[&_svg]:shrink-0",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("ui:flex-1 ui:outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
