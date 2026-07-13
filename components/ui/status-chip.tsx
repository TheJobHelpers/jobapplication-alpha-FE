// StatusChip — pill for a job status. One truth, two views: the same status
// renders the internal label by default and the humane client wording when
// variant="client" (DESIGN.md §Component rules 6). Color is driven entirely
// by STATUS_META so a status never changes color between screens.

import { STATUS_META, type JobStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";

export function StatusChip({
  status,
  variant = "internal",
  className,
}: {
  status: JobStatus;
  variant?: "internal" | "client";
  className?: string;
}) {
  const meta = STATUS_META[status];
  const label = variant === "client" ? meta.clientLabel : meta.label;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none whitespace-nowrap",
        className,
      )}
      style={{
        color: meta.color,
        // background = status color at ~18% opacity (DESIGN.md §Status scale)
        backgroundColor: `color-mix(in srgb, ${meta.color} 18%, transparent)`,
      }}
    >
      {label}
    </span>
  );
}
