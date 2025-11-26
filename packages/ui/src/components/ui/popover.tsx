"use client"

import * as React from "react"
import * as PopoverPrimitive from "@radix-ui/react-popover"

import { cn } from "@/lib/utils"

function Popover({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "ui:bg-popover ui:text-popover-foreground data-[state=open]:ui:animate-in data-[state=closed]:ui:animate-out data-[state=closed]:ui:fade-out-0 data-[state=open]:ui:fade-in-0 data-[state=closed]:ui:zoom-out-95 data-[state=open]:ui:zoom-in-95 data-[side=bottom]:ui:slide-in-from-top-2 data-[side=left]:ui:slide-in-from-right-2 data-[side=right]:ui:slide-in-from-left-2 data-[side=top]:ui:slide-in-from-bottom-2 ui:z-50 ui:w-72 ui:origin-(--radix-popover-content-transform-origin) ui:rounded-md ui:border ui:p-4 ui:shadow-md ui:outline-hidden",
          className
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

function PopoverAnchor({
  ...props
}: React.ComponentProps<typeof PopoverPrimitive.Anchor>) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />
}

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor }
