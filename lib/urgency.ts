// Urgency stripe colors — the 3px left stripe on queue rows (DESIGN.md
// §Component rules 2): red = quota/deadline risk, amber = stale,
// green = ready/positive, blue/violet = informational.

import type { Urgency } from "@/lib/api/types";

export const URGENCY_COLOR: Record<Urgency, string> = {
  danger: "var(--status-blocked)", // red
  warning: "var(--status-interview)", // amber
  positive: "var(--status-offer)", // green
  info: "var(--status-review)", // violet — informational
};
