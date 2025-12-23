import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import * as LabelPrimitive from "@radix-ui/react-label";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";

import { cn } from "@/lib/utils";

const filterOptionVariants = cva(
  "transition-colors w-full rounded-md border p-2 text-neutral-500",
  {
    variants: {
      variant: {
        default:
          "has-[[aria-checked=true]]:text-neutral-800 has-[[aria-checked=true]]:border-neutral-800 has-[[aria-checked=true]]:bg-neutral-50",
        debug:
          "has-[[aria-checked=true]]:text-neutral-500 has-[[aria-checked=true]]:border-neutral-500 has-[[aria-checked=true]]:bg-neutral-50",
        info: "has-[[aria-checked=true]]:text-blue-500 has-[[aria-checked=true]]:border-blue-500 has-[[aria-checked=true]]:bg-blue-50",
        warn: "has-[[aria-checked=true]]:text-amber-500 has-[[aria-checked=true]]:border-amber-500 has-[[aria-checked=true]]:bg-amber-50",
        error:
          "has-[[aria-checked=true]]:text-red-500 has-[[aria-checked=true]]:border-red-500 has-[[aria-checked=true]]:bg-red-50",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const filterOptionCheckboxVariants = cva("transition-colors", {
  variants: {
    variant: {
      default:
        "data-[state=checked]:border-neutral-800 data-[state=checked]:bg-neutral-800 data-[state=checked]:text-white",
      debug:
        "data-[state=checked]:border-neutral-500 data-[state=checked]:bg-neutral-500 data-[state=checked]:text-white",
      info: "data-[state=checked]:border-blue-500 data-[state=checked]:bg-blue-500 data-[state=checked]:text-white",
      warn: "data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500 data-[state=checked]:text-white",
      error:
        "data-[state=checked]:border-red-500 data-[state=checked]:bg-red-500 data-[state=checked]:text-white",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

export function FilterOption({
  className,
  variant,
  children,
  ...props
}: React.ComponentProps<typeof LabelPrimitive.Root> &
  VariantProps<typeof filterOptionVariants>) {
  return (
    <Label
      className={cn(filterOptionVariants({ variant }), className)}
      {...props}
    >
      {children}
    </Label>
  );
}

export function FilterOptionCheckbox({
  className,
  variant,
  label,
  onChange,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> &
  VariantProps<typeof filterOptionCheckboxVariants> & { label: string }) {
  return (
    <div className="inline-flex items-center gap-2">
      <Checkbox
        className={cn(filterOptionCheckboxVariants({ variant }), className)}
        onChange={onChange}
        {...props}
      />
      <p className="text-sm">{label}</p>
    </div>
  );
}

export { filterOptionVariants, filterOptionCheckboxVariants };
