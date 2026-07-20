import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** Single source of truth for badge-tier colors (bronze/silver/gold/legend) —
 * reused as-is by non-pill layouts (e.g. the profile page's badge tiles) so
 * the same tier never renders in two different colors across the app. */
export const TIER_COLOR_CLASSES = {
  bronze: "border-amber-700/40 bg-amber-700/10 text-amber-700 dark:text-amber-400",
  silver: "border-slate-400/40 bg-slate-400/10 text-slate-600 dark:text-slate-300",
  gold: "border-amber-400/50 bg-amber-400/15 text-amber-600 dark:text-amber-400 font-bold",
  legend: "border-purple-500/50 bg-purple-500/15 text-purple-600 dark:text-purple-400 font-extrabold",
} as const;

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-secondary text-secondary-foreground",
        destructive: "border-transparent bg-destructive text-destructive-foreground",
        outline: "text-foreground",
        success:
          "border-transparent bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        warning:
          "border-transparent bg-amber-500/15 text-amber-600 dark:text-amber-400",
        brand:
          "border-transparent bg-brand-500/15 text-brand-600 dark:text-brand-400",
        ...TIER_COLOR_CLASSES,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
