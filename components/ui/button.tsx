// Button — flat, one accent. primary = portal accent + white text; secondary =
// bordered ghost; destructive = rose outline (fills only at confirm, handled by
// callers). One primary per view (DESIGN.md §Component rules 4).

import { cn } from "@/lib/cn";

type Variant = "primary" | "secondary" | "destructive";
type Size = "sm" | "md";

const BASE =
  "inline-flex items-center justify-center gap-1.5 rounded-md font-semibold whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 focus-visible:ring-offset-background disabled:opacity-50 disabled:pointer-events-none";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]",
  secondary:
    "border border-zinc-700 text-zinc-200 hover:bg-zinc-800/60 hover:border-zinc-600",
  destructive:
    "border border-status-rejected/70 text-status-rejected hover:bg-status-rejected/10",
};

const SIZES: Record<Size, string> = {
  sm: "h-7 px-2.5 text-[12px]",
  md: "h-9 px-3.5 text-[13px]",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
}) {
  return (
    <button
      className={cn(BASE, VARIANTS[variant], SIZES[size], className)}
      {...props}
    />
  );
}
