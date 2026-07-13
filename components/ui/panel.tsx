// Panel — the base flat surface: one step lighter than the page, 1px hairline
// border, 8px radius. No blur, no gradient (DESIGN.md §Style). Portal-aware via
// the --panel / --panel-border tokens.

import { cn } from "@/lib/cn";

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-panel-border bg-panel",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
