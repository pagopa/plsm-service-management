import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const pillowVariants = cva("w-full h-full rounded-sm", {
  variants: {
    variant: {
      default: "bg-primary",
      debug: "bg-neutral-500",
      info: "bg-blue-500",
      warn: "bg-amber-500",
      error: "bg-red-500",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

function Pillow({
  className,
  variant,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof pillowVariants>) {
  return (
    <div className="w-[3px] h-5 py-0.5">
      <div
        data-slot="pillow"
        className={cn(pillowVariants({ variant }), className)}
        {...props}
      />
    </div>
  );
}

export { Pillow, pillowVariants };
