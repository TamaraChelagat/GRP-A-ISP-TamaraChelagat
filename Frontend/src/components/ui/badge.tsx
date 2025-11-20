import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "bg-primary/20 text-primary border border-primary/30",
        secondary: "bg-secondary/20 text-secondary-foreground border border-secondary/30",
        destructive: "bg-destructive/20 text-destructive border border-destructive/30",
        success: "bg-success/20 text-success border border-success/30",
        warning: "bg-warning/20 text-warning border border-warning/30",
        outline: "text-foreground border border-border",
        clear: "bg-success/20 text-success border border-success/30",
        flagged: "bg-destructive/20 text-destructive border border-destructive/30",
        review: "bg-warning/20 text-warning border border-warning/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
