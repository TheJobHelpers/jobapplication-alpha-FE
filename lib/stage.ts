// Client lifecycle stages — shared color + ordering (DESIGN.md status palette).
import type { ClientStage } from "@/lib/api";

export const CLIENT_STAGES: ClientStage[] = [
  "onboarding",
  "active",
  "paused",
  "closed",
];

export function stageColor(stage: ClientStage): string {
  return stage === "active"
    ? "var(--status-offer)"
    : stage === "onboarding"
      ? "var(--status-review)"
      : stage === "paused"
        ? "var(--status-interview)"
        : "var(--status-expired)";
}
