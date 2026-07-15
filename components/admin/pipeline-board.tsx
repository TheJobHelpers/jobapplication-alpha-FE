"use client";

// Pipeline Kanban — every active application as a card in a status column.
// Drag cards between columns to move status (role-gated: JS can only send to
// review, JA works application stages, managers/admins do anything). Group by
// client or team member (manager/admin) turns the board into swimlanes.

import { useMemo, useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { applyJobOverride, useStore } from "@/components/shell/store-context";
import { CommentCount } from "@/components/ui/job-comments";
import { JobDetailModal } from "@/components/ui/job-detail-modal";
import { MatchScore } from "@/components/ui/match-score";
import { STATUS_META, type ApplicationJob, type JobStatus } from "@/lib/api";
import { canAssign, canTransition } from "@/lib/permissions";

const STALE_BEFORE = "2026-07-09";

type Column = {
  key: string;
  label: string;
  color: string;
  statuses: JobStatus[];
  primary: JobStatus; // status a card takes when dropped here
};

const COLUMNS: Column[] = [
  { key: "sourced", label: "Sourced", color: "var(--status-sourced)", statuses: ["sourced"], primary: "sourced" },
  { key: "review", label: "Client review", color: "var(--status-review)", statuses: ["client_review"], primary: "client_review" },
  { key: "approved", label: "Approved", color: "var(--status-progress)", statuses: ["approved", "in_progress"], primary: "approved" },
  { key: "assigned", label: "Assigned", color: "var(--status-assigned)", statuses: ["assigned"], primary: "assigned" },
  { key: "applied", label: "Applied", color: "var(--status-applied)", statuses: ["applying", "applied"], primary: "applied" },
  { key: "interviewing", label: "Interviewing", color: "var(--status-interview)", statuses: ["interviewing"], primary: "interviewing" },
  { key: "offer", label: "Offer", color: "var(--status-offer)", statuses: ["offer"], primary: "offer" },
  { key: "closed", label: "Closed", color: "var(--status-expired)", statuses: ["closed", "rejected", "expired", "blocked"], primary: "closed" },
];

const GRID = { gridTemplateColumns: `repeat(${COLUMNS.length}, minmax(200px, 1fr))` };
const MIN_WIDTH = COLUMNS.length * 210;

type Group = "none" | "client" | "member";

function getLaneSummary(jobsList: ApplicationJob[]) {
  const counts = {
    sourced: 0,
    review: 0,
    approved: 0,
    assigned: 0,
    applied: 0,
    interviewing: 0,
    offer: 0,
    closed: 0,
  };

  jobsList.forEach((j) => {
    COLUMNS.forEach((col) => {
      if (col.statuses.includes(j.status)) {
        counts[col.key as keyof typeof counts]++;
      }
    });
  });

  return COLUMNS.map((col) => {
    const count = counts[col.key as keyof typeof counts];
    if (count === 0) return null;
    return (
      <span key={col.key} className="flex items-center gap-1 bg-zinc-800/40 rounded px-1.5 py-0.5 border border-panel-border/30">
        <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
        <span className="font-semibold text-zinc-300 tabular-nums">{count}</span>
        <span className="text-[9.5px] text-zinc-500 lowercase">{col.label}</span>
      </span>
    );
  }).filter(Boolean);
}

export function PipelineBoard({ jobs: initial }: { jobs: ApplicationJob[] }) {
  const { user } = useCurrentUser();
  // Status lives in the shared store so moves persist and the Client Portal
  // sees them (My Jobs mirrors this board). Client decisions land here too —
  // an acceptance shows up in Approved, a decline in Closed with its reason.
  const { jobStatusById, jobMetaById, setJobStatus, logAudit } = useStore();
  const jobs = useMemo(
    () => initial.map((j) => applyJobOverride(j, jobStatusById, jobMetaById)),
    [initial, jobStatusById, jobMetaById],
  );
  const [group, setGroup] = useState<Group>("none");
  const [collapsedLanes, setCollapsedLanes] = useState<Set<string>>(new Set());
  const [assignee, setAssignee] = useState("all");
  const [client, setClient] = useState("all");
  const [staleOnly, setStaleOnly] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);

  const clientNames = useMemo(
    () => [...new Set(initial.map((j) => j.clientName))].sort(),
    [initial],
  );
  const assigneeNames = useMemo(
    () => [...new Set(initial.map((j) => j.assignedToName).filter(Boolean))].sort() as string[],
    [initial],
  );

  const filtered = jobs.filter((j) => {
    if (client !== "all" && j.clientName !== client) return false;
    if (assignee !== "all") {
      if (assignee === "unassigned" && j.assignedToName) return false;
      if (assignee !== "unassigned" && j.assignedToName !== assignee) return false;
    }
    if (staleOnly && !(j.updatedAt <= STALE_BEFORE)) return false;
    return true;
  });

  const dragJob = dragId ? jobs.find((j) => j.id === dragId) ?? null : null;

  function drop(colPrimary: JobStatus) {
    if (!dragJob) return;
    if (!canTransition(user, dragJob.status, colPrimary)) {
      setDragId(null);
      return;
    }
    if (dragJob.status !== colPrimary) {
      setJobStatus(dragJob.id, colPrimary);
      logAudit(
        user.name,
        `Moved job to ${STATUS_META[colPrimary].label}`,
        `${dragJob.company} · ${dragJob.title} (${dragJob.clientName})`,
      );
    }
    setDragId(null);
  }

  const lanes: { key: string; label: string; jobs: ApplicationJob[] }[] =
    group === "none"
      ? [{ key: "all", label: "", jobs: filtered }]
      : group === "client"
        ? clientNames
            .map((name) => ({ key: name, label: name, jobs: filtered.filter((j) => j.clientName === name) }))
            .filter((l) => l.jobs.length)
        : [...assigneeNames, "Unassigned"]
            .map((name) => ({
              key: name,
              label: name,
              jobs: filtered.filter((j) => (j.assignedToName ?? "Unassigned") === name),
            }))
            .filter((l) => l.jobs.length);

  const canMemberLens = canAssign(user);

  return (
    <div className="px-6 py-6">
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Pipeline
          </p>
          <h1 className="mt-1 text-[16px] font-semibold">Applications</h1>
        </div>
        <p className="text-[11px] text-zinc-500">
          Drag cards between columns to move status — your role limits where they can go.
        </p>
      </header>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Segment label="Group">
          <Seg
            active={group === "none"}
            onClick={() => {
              setGroup("none");
              setCollapsedLanes(new Set());
            }}
          >
            None
          </Seg>
          <Seg
            active={group === "client"}
            onClick={() => {
              setGroup("client");
              setCollapsedLanes(new Set());
            }}
          >
            Client
          </Seg>
          {canMemberLens && (
            <Seg
              active={group === "member"}
              onClick={() => {
                setGroup("member");
                setCollapsedLanes(new Set());
              }}
            >
              Assignee
            </Seg>
          )}
        </Segment>

        <Select value={client} onChange={setClient} label="Client">
          <option value="all">All clients</option>
          {clientNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>

        <Select value={assignee} onChange={setAssignee} label="Assignee">
          <option value="all">All assignees</option>
          <option value="unassigned">Unassigned</option>
          {assigneeNames.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>

        <button
          onClick={() => setStaleOnly((v) => !v)}
          className={
            "rounded-md border px-2.5 py-1.5 text-[12px] font-medium transition-colors " +
            (staleOnly
              ? "border-status-interview/60 bg-status-interview/10 text-status-interview"
              : "border-panel-border text-muted hover:text-zinc-200")
          }
        >
          Stale &gt; 5 days
        </button>

        {group !== "none" && (
          <button
            onClick={() => {
              const allCollapsed = collapsedLanes.size === lanes.length;
              if (allCollapsed) {
                setCollapsedLanes(new Set());
              } else {
                setCollapsedLanes(new Set(lanes.map((l) => l.key)));
              }
            }}
            className="rounded-md border border-panel-border bg-panel/20 px-2.5 py-1.5 text-[12px] font-medium text-muted hover:text-zinc-200 transition-colors"
          >
            {collapsedLanes.size === lanes.length ? "Expand all lanes" : "Collapse all lanes"}
          </button>
        )}
      </div>

      {/* Board */}
      <div className="overflow-x-auto pb-4">
        <div style={{ minWidth: MIN_WIDTH }}>
          {/* Column headers */}
          <div className="grid gap-3" style={GRID}>
            {COLUMNS.map((col) => {
              const count = filtered.filter((j) => col.statuses.includes(j.status)).length;
              const invalid = dragJob && !canTransition(user, dragJob.status, col.primary);
              return (
                <div
                  key={col.key}
                  className={"flex items-center gap-2 px-1 pb-2 " + (invalid ? "opacity-30" : "")}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: col.color }} />
                  <span className="text-[12px] font-semibold text-zinc-200">{col.label}</span>
                  <span className="font-mono text-[11px] tabular-nums text-zinc-500">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Lanes */}
          <div className="space-y-5">
            {lanes.length === 0 && (
              <p className="py-10 text-center text-[13px] text-zinc-500">No matching applications.</p>
            )}
            {lanes.map((lane) => (
              <div
                key={lane.key}
                className={
                  "border border-panel-border rounded-lg p-3.5 transition-colors " +
                  (collapsedLanes.has(lane.key) ? "bg-panel/10" : "bg-panel/20")
                }
              >
                {lane.label && (
                  <div
                    onClick={() => {
                      setCollapsedLanes((prev) => {
                        const next = new Set(prev);
                        if (next.has(lane.key)) next.delete(lane.key);
                        else next.add(lane.key);
                        return next;
                      });
                    }}
                    className="flex items-center justify-between cursor-pointer border-b border-panel-border/50 pb-2.5 select-none hover:text-zinc-200"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-zinc-500 text-[10px] w-3 text-center">
                        {collapsedLanes.has(lane.key) ? "►" : "▼"}
                      </span>
                      <span className="text-[12.5px] font-semibold text-zinc-200">{lane.label}</span>
                      <span className="rounded-full bg-zinc-800/80 px-2 py-0.5 font-mono text-[10px] tabular-nums text-zinc-500">
                        {lane.jobs.length} application{lane.jobs.length > 1 ? "s" : ""}
                      </span>
                    </div>
                    {/* Summarized counts visible for quick scanning */}
                    <div className="flex items-center gap-2 text-[11px]">
                      {getLaneSummary(lane.jobs)}
                    </div>
                  </div>
                )}
                
                {!collapsedLanes.has(lane.key) && (
                  <div className={`grid items-start gap-3 ${lane.label ? "mt-3.5" : ""}`} style={GRID}>
                    {COLUMNS.map((col) => {
                      const cards = lane.jobs.filter((j) => col.statuses.includes(j.status));
                      const invalid = dragJob && !canTransition(user, dragJob.status, col.primary);
                      return (
                        <div
                          key={col.key}
                          onDragOver={(e) => {
                            if (dragJob && !invalid) e.preventDefault();
                          }}
                          onDrop={() => drop(col.primary)}
                          className={
                            "min-h-[60px] rounded-lg border border-dashed p-1.5 transition-colors " +
                            (dragJob
                              ? invalid
                                ? "border-transparent opacity-30"
                                : "border-[var(--accent)]/50 bg-[color-mix(in_srgb,var(--accent)_6%,transparent)]"
                              : "border-transparent")
                          }
                        >
                          <div className="space-y-2">
                            {cards.map((job) => (
                              <JobCard
                                key={job.id}
                                job={job}
                                author={user.name}
                                showClient={group !== "client"}
                                onDragStart={() => setDragId(job.id)}
                                onDragEnd={() => setDragId(null)}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function JobCard({
  job,
  author,
  showClient,
  onDragStart,
  onDragEnd,
}: {
  job: ApplicationJob;
  author: string;
  showClient: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  const meta = STATUS_META[job.status];
  const stale = job.updatedAt <= STALE_BEFORE;
  const [detail, setDetail] = useState(false);
  return (
    <>
      <div
        draggable
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={() => setDetail(true)}
        className="cursor-grab rounded-md border border-panel-border bg-panel p-2.5 transition-colors hover:border-zinc-600 active:cursor-grabbing"
        style={{ boxShadow: `inset 3px 0 0 0 ${meta.color}` }}
        title="Click for details & comments"
      >
        <p className="truncate text-[12.5px] font-medium text-zinc-100">{job.title}</p>
        <p className="truncate text-[11px] text-muted">{job.company}</p>
        {showClient && (
          <p className="mt-0.5 truncate text-[11px] text-zinc-400">{job.clientName}</p>
        )}
        <div className="mt-2 flex items-center justify-between gap-2">
          <MatchScore score={job.matchScore} />
          <CommentCount jobId={job.id} />
          {job.assignedToName && (
            <span className="truncate text-[10px] text-zinc-500">{job.assignedToName}</span>
          )}
        </div>
        {job.reason && (job.status === "blocked" || job.status === "rejected") && (
          <p
            className="mt-1.5 text-[10.5px]"
            style={{ color: meta.color }}
            title={job.reason}
          >
            {job.reason}
          </p>
        )}
        {stale && (
          <span className="mt-1.5 inline-block rounded-full bg-status-interview/15 px-1.5 py-0.5 text-[9px] font-semibold text-status-interview">
            Stale
          </span>
        )}
      </div>
      {detail && (
        <JobDetailModal
          job={job}
          author={author}
          side="team"
          onClose={() => setDetail(false)}
        />
      )}
    </>
  );
}

// ── controls ──────────────────────────────────────────────────────────
function Segment({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
        {label}
      </span>
      <div className="flex gap-0.5 rounded-md border border-panel-border p-0.5">
        {children}
      </div>
    </div>
  );
}

function Seg({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={
        "rounded px-2 py-1 text-[12px] font-medium transition-colors " +
        (active ? "bg-[var(--accent)] text-white" : "text-muted hover:text-zinc-200")
      }
    >
      {children}
    </button>
  );
}

function Select({
  value,
  onChange,
  label,
  children,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-1.5">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-panel-border bg-panel px-2 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-zinc-600"
      >
        {children}
      </select>
    </label>
  );
}
