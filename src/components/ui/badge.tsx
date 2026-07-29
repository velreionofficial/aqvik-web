import type * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-mono text-[0.6875rem] uppercase tracking-[0.14em]",
  {
    variants: {
      variant: {
        outline: "border-hairline-strong bg-surface text-muted",
        accent: "border-primary/30 bg-primary/10 text-primary-soft",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export type BadgeProps = React.ComponentPropsWithoutRef<"span"> &
  VariantProps<typeof badgeVariants>;

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
