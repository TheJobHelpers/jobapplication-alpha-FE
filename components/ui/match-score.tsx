// MatchScore — the system's signature element (DESIGN.md §Component rules 1).
// A small horizontal meter + a percentage in mono, always together and visually
// identical everywhere a job appears, in either portal. Deliberately portal-neutral
// (not the portal accent) so it reads the same on both sides.

import { cn } from "@/lib/cn";

const METER_FILL = "rgb(129 140 248)"; // indigo-400, fixed across portals

export function MatchScore({
  score,
  className,
}: {
  score?: number; // 0..1 — optional; jobs added by hand may have no score
  className?: string;
}) {
  // No score (e.g. a manually-added job) → a quiet placeholder keeps alignment.
  if (score === undefined) {
    return (
      <span className={cn("font-mono text-[11px] text-muted", className)}>—</span>
    );
  }
  const pct = Math.max(0, Math.min(1, score)) * 100;
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        aria-hidden
        className="h-1 w-9 overflow-hidden rounded-full bg-panel-border"
      >
        <span
          className="block h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: METER_FILL }}
        />
      </span>
      <span className="font-mono text-[11px] tabular-nums text-foreground/80">
        {Math.round(pct)}%
      </span>
    </span>
  );
}
