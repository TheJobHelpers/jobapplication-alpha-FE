"use client";

// Job detail popup — opened by clicking a card in either portal. Shows the
// job's facts (status, match, salary, dates, assignee) and the shared comment
// thread. Portal tokens only, so it renders correctly on both sides and themes.

import { useEffect } from "react";
import { JobComments } from "@/components/ui/job-comments";
import { MatchScore } from "@/components/ui/match-score";
import { StatusChip } from "@/components/ui/status-chip";
import {
  REJECT_CATEGORY_LABEL,
  STATUS_META,
  type ApplicationJob,
  type CommentSide,
} from "@/lib/api";

export function JobDetailModal({
  job,
  author,
  side,
  onClose,
}: {
  job: ApplicationJob;
  author: string; // signed-in name to stamp on new comments
  side: CommentSide;
  onClose: () => void;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  const meta = STATUS_META[job.status];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${job.title} at ${job.company}`}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-panel-border bg-panel p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[15px] font-semibold leading-snug text-foreground">
              {job.title}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {job.company}
              {job.location ? ` · ${job.location}` : ""}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-panel-border text-muted transition-colors hover:text-foreground"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 flex items-center gap-2.5">
          <StatusChip
            status={job.status}
            variant={side === "client" ? "client" : undefined}
          />
          <MatchScore score={job.matchScore} />
        </div>

        {/* Facts */}
        <div className="mt-4 space-y-1.5 border-t border-panel-border pt-3">
          {job.salary && <Fact label="Salary" value={job.salary} />}
          {side === "team" && <Fact label="Client" value={job.clientName} />}
          {job.assignedToName && (
            <Fact
              label={side === "team" ? "Assigned to" : "Handled by"}
              value={job.assignedToName}
            />
          )}
          {job.postedAt && <Fact label="Posted" value={job.postedAt} />}
          <Fact label="Last update" value={job.updatedAt} />
          {job.rejectCategory && (
            <Fact
              label="Decline reason"
              value={REJECT_CATEGORY_LABEL[job.rejectCategory]}
            />
          )}
        </div>

        {/* Reason is first-class on blocked/rejected (DESIGN.md) */}
        {job.reason && (
          <p
            className="mt-3 rounded-md px-2.5 py-2 text-[11.5px] leading-snug"
            style={{
              color: meta.color,
              backgroundColor: `color-mix(in srgb, ${meta.color} 10%, transparent)`,
            }}
          >
            {job.status === "blocked" && side === "client"
              ? `What we need: ${job.reason}`
              : job.reason}
          </p>
        )}

        {/* Comments */}
        <div className="mt-4 border-t border-panel-border pt-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Comments
          </p>
          <JobComments jobId={job.id} author={author} side={side} />
        </div>
      </div>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <span className="text-[11.5px] text-muted">{label}</span>
      <span className="text-right text-[12.5px] text-foreground">{value}</span>
    </div>
  );
}
