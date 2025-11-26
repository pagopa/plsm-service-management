import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { ChevronDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"

function Accordion({
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />
}

function AccordionItem({
  className,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn("ui:border-b last:ui:border-b-0", className)}
      {...props}
    />
  )
}

function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="ui:flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "focus-visible:ui:border-ring focus-visible:ui:ring-ring/50 ui:flex ui:flex-1 ui:items-start ui:justify-between ui:gap-4 ui:rounded-md ui:py-4 ui:text-left ui:text-sm ui:font-medium ui:transition-all ui:outline-none hover:ui:underline focus-visible:ui:ring-[3px] disabled:ui:pointer-events-none disabled:ui:opacity-50 [&[data-state=open]>svg]:ui:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="ui:text-muted-foreground ui:pointer-events-none ui:size-4 ui:shrink-0 ui:translate-y-0.5 ui:transition-transform ui:duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  )
}

function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className="data-[state=closed]:ui:animate-accordion-up data-[state=open]:ui:animate-accordion-down ui:overflow-hidden ui:text-sm"
      {...props}
    >
      <div className={cn("ui:pt-0 ui:pb-4", className)}>{children}</div>
    </AccordionPrimitive.Content>
  )
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
