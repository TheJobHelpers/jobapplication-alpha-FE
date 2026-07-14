"use client";

// My Jobs — the client's window into the same pipeline the team works. Two views
// of the same data: a Board (kanban) to see everything at a glance, and a List
// grouped friendliest-first. Read-only: clients track, they don't move cards.
// "Blocked" reads as "Needs your input"; declines keep the client's own reason
// (06/08 UX — one truth, two views).

import Link from "next/link";
import { useState } from "react";
import { useClientPortal } from "@/components/client/client-portal-context";
import { Button } from "@/components/ui/button";
import { CommentCount } from "@/components/ui/job-comments";
import { JobDetailModal } from "@/components/ui/job-detail-modal";
import { MatchScore } from "@/components/ui/match-score";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import {
  REJECT_CATEGORY_LABEL,
  type ApplicationJob,
  type JobStatus,
} from "@/lib/api";
import {
  CLIENT_JOBS_VIEW_KEY,
  useSession,
  writeSession,
} from "@/lib/session";

// Client-facing board columns mirror the real flow left-to-right: the client
// reviews → accepts → the team takes accepted jobs to In progress → Applied →
// outcomes. Blocked jobs stay inside In progress with a red "what we need"
// callout (plus the dashboard banner), so the flow reads clean. Cards carry a
// status chip to disambiguate within a grouped column.
const COLUMNS: { key: string; label: string; color: string; statuses: JobStatus[] }[] = [
  { key: "review", label: "Your review", color: "var(--status-review)", statuses: ["client_review"] },
  { key: "accepted", label: "Accepted", color: "var(--status-offer)", statuses: ["approved"] },
  { key: "progress", label: "In progress", color: "var(--status-progress)", statuses: ["in_progress", "assigned", "blocked"] },
  { key: "applied", label: "Applied", color: "var(--status-applied)", statuses: ["applying", "applied"] },
  { key: "outcomes", label: "Interviews & offers", color: "var(--status-interview)", statuses: ["interviewing", "offer"] },
  { key: "closed", label: "Closed", color: "var(--status-expired)", statuses: ["rejected", "expired", "closed"] },
];

// Columns whose cards should show a status chip (they group several statuses).
const MULTI = new Set(["progress", "applied", "outcomes", "closed"]);

// List groups, friendliest-first — blocked leads because it waits on the client.
const GROUPS: { title: string; note?: string; statuses: JobStatus[] }[] = [
  { title: "We need something from you", statuses: ["blocked"] },
  { title: "Waiting for your review", statuses: ["client_review"] },
  { title: "Accepted", note: "You accepted these — we're getting the applications ready.", statuses: ["approved"] },
  { title: "In progress", statuses: ["in_progress", "assigned"] },
  { title: "Applied", note: "Submitted — waiting to hear back.", statuses: ["applying", "applied"] },
  { title: "Interviews & offers", statuses: ["interviewing", "offer"] },
  { title: "Not moving forward", statuses: ["rejected", "expired", "closed"] },
];

export default function ClientJobsPage() {
  const { jobs } = useClientPortal();
  const stored = useSession(CLIENT_JOBS_VIEW_KEY);
  const view = stored === "list" ? "list" : "board"; // board is the default

  return (
    <div className="flex h-full flex-col px-8 py-8">
      <header className="flex shrink-0 items-end justify-between gap-4">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">My Jobs</h1>
          <p className="mt-1 text-[14px] text-muted">
            Every job we’re working on for you, and where each one stands.
          </p>
        </div>
        <ViewToggle view={view} />
      </header>

      {jobs.length === 0 ? (
        <Panel className="mt-6 p-6 text-center text-[13.5px] text-muted">
          Nothing here yet. We’ll start adding jobs as we source them for you.
        </Panel>
      ) : view === "board" ? (
        <div className="mt-5 min-h-0 flex-1">
          <BoardView jobs={jobs} />
        </div>
      ) : (
        <div className="mt-5 min-h-0 flex-1 overflow-y-auto">
          <ListView jobs={jobs} />
        </div>
      )}
    </div>
  );
}

function ViewToggle({ view }: { view: "board" | "list" }) {
  return (
    <div className="flex items-center gap-0.5 rounded-md border border-panel-border p-0.5">
      {(["board", "list"] as const).map((v) => (
        <button
          key={v}
          onClick={() => writeSession(CLIENT_JOBS_VIEW_KEY, v)}
          className={
            "rounded px-2.5 py-1 text-[12px] font-medium capitalize transition-colors " +
            (view === v
              ? "bg-[var(--accent)] text-white"
              : "text-muted hover:text-foreground")
          }
        >
          {v}
        </button>
      ))}
    </div>
  );
}

// ── Board (kanban) ────────────────────────────────────────────────────
const COL_TRACK = "color-mix(in srgb, var(--panel-border) 40%, transparent)";

function BoardView({ jobs }: { jobs: ApplicationJob[] }) {
  return (
    <div className="h-full overflow-x-auto">
      <div
        className="grid h-full gap-4"
        style={{
          gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(210px, 1fr))`,
          minWidth: COLUMNS.length * 210,
        }}
      >
        {COLUMNS.map((col) => {
          const items = jobs.filter((j) => col.statuses.includes(j.status));
          return (
            <section key={col.key} className="flex min-h-0 flex-col">
              <div className="mb-2.5 flex shrink-0 items-center gap-2 px-0.5">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: col.color }}
                />
                <span className="text-[11.5px] font-semibold">{col.label}</span>
                <span className="ml-auto rounded-full border border-panel-border px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-muted">
                  {items.length}
                </span>
              </div>

              <div
                className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto rounded-xl p-2.5"
                style={{ backgroundColor: COL_TRACK }}
              >
                {items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center text-[11.5px] text-muted">
                    Nothing here
                  </div>
                ) : (
                  items.map((job) => (
                    <BoardCard key={job.id} job={job} showChip={MULTI.has(col.key)} />
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({
  job,
  showChip,
}: {
  job: ApplicationJob;
  showChip: boolean;
}) {
  const { client } = useClientPortal();
  const [detail, setDetail] = useState(false);
  const isReview = job.status === "client_review";

  return (
    <>
      <div
        className="cursor-pointer rounded-lg border border-panel-border bg-panel p-3.5 shadow-sm transition-colors hover:border-[var(--accent)]/50"
        onClick={() => setDetail(true)}
        title="Click for details & comments"
      >
        <div className="flex items-start justify-between gap-2">
          <p className="text-[13px] font-semibold leading-snug">{job.title}</p>
          {job.matchScore !== undefined && (
            <MatchScore score={job.matchScore} className="mt-0.5 shrink-0" />
          )}
        </div>
        <p className="mt-1 truncate text-[12px] text-muted">
          {job.company}
          {job.location ? ` · ${job.location}` : ""}
        </p>

        {job.status === "blocked" && job.reason && (
          <p className="mt-2.5 rounded-md bg-status-blocked/10 px-2 py-1.5 text-[11px] leading-snug text-status-blocked">
            {job.reason}
          </p>
        )}
        {job.status === "rejected" && job.rejectCategory && (
          <p className="mt-2 text-[11px] text-muted">
            Reason: {REJECT_CATEGORY_LABEL[job.rejectCategory]}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2.5">
            {showChip && <StatusChip status={job.status} variant="client" />}
            <CommentCount jobId={job.id} portal="client" />
          </span>
          {isReview && (
            <Link href="/client/review" onClick={(e) => e.stopPropagation()}>
              <Button variant="primary" size="sm">
                Review
              </Button>
            </Link>
          )}
        </div>
      </div>
      {detail && (
        <JobDetailModal
          job={job}
          author={client.name}
          side="client"
          onClose={() => setDetail(false)}
        />
      )}
    </>
  );
}

// ── List ──────────────────────────────────────────────────────────────
function ListView({ jobs }: { jobs: ApplicationJob[] }) {
  return (
    <div className="space-y-6">
      {GROUPS.map((group) => {
        const items = jobs.filter((j) => group.statuses.includes(j.status));
        if (items.length === 0) return null;
        return (
          <section key={group.title}>
            <div className="mb-2">
              <h2 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                {group.title} · {items.length}
              </h2>
              {group.note && (
                <p className="mt-0.5 text-[12px] text-muted">{group.note}</p>
              )}
            </div>
            <Panel className="divide-y divide-panel-border overflow-hidden">
              {items.map((job) => (
                <JobRow key={job.id} job={job} />
              ))}
            </Panel>
          </section>
        );
      })}
    </div>
  );
}

function JobRow({ job }: { job: ApplicationJob }) {
  const { client } = useClientPortal();
  const [detail, setDetail] = useState(false);
  const isReview = job.status === "client_review";
  const dimmed = ["rejected", "expired", "closed"].includes(job.status);

  return (
    <>
      <div
        className={
          "cursor-pointer px-4 py-3 transition-colors hover:bg-[color-mix(in_srgb,var(--panel-border)_35%,transparent)] " +
          (dimmed ? "opacity-70" : "")
        }
        onClick={() => setDetail(true)}
        title="Click for details & comments"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13.5px] font-medium">{job.title}</p>
            <p className="truncate text-[12.5px] text-muted">
              {job.company} · {job.location}
            </p>
          </div>
          <CommentCount jobId={job.id} portal="client" />
          <StatusChip status={job.status} variant="client" />
          {isReview && (
            <Link href="/client/review" onClick={(e) => e.stopPropagation()}>
              <Button variant="secondary" size="sm">
                Review
              </Button>
            </Link>
          )}
        </div>

        {job.status === "blocked" && job.reason && (
          <p className="mt-1.5 text-[12.5px] text-status-blocked">
            What we need: <span className="text-foreground">{job.reason}</span>
          </p>
        )}
        {job.status === "rejected" && (
          <p className="mt-1.5 text-[12px] text-muted">
            You declined
            {job.rejectCategory
              ? ` (${REJECT_CATEGORY_LABEL[job.rejectCategory]})`
              : ""}
            {job.reason ? `: “${job.reason}”` : ""}
          </p>
        )}
      </div>
      {detail && (
        <JobDetailModal
          job={job}
          author={client.name}
          side="client"
          onClose={() => setDetail(false)}
        />
      )}
    </>
  );
}
