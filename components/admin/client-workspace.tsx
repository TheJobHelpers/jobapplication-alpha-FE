"use client";

// Client Workspace — the core internal screen (06 UX). The unit of work is a
// client-week: get this client their N jobs and keep applications moving.
// Search lives inside the workspace, pre-filled from the client's preferences;
// results stream into the shortlist, ranked by match score. Tick good ones →
// Assign → the quota bar fills. All state is local mock behavior for now.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/ui/match-score";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import {
  api,
  JOB_SOURCE_LABEL,
  type ApplicationJob,
  type Client,
  type JobSource,
  type JobStatus,
} from "@/lib/api";

const SHORTLIST_STATUSES = new Set<JobStatus>([
  "sourced",
  "client_review",
  "approved",
]);
const ACTIVE_STATUSES = new Set<JobStatus>([
  "in_progress",
  "assigned",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "blocked",
]);
const HISTORY_STATUSES = new Set<JobStatus>(["rejected", "closed", "expired"]);

const byScore = (a: ApplicationJob, b: ApplicationJob) =>
  b.matchScore - a.matchScore;

type Tab = "week" | "history" | "profile";

export function ClientWorkspace({
  client,
  initialJobs,
}: {
  client: Client;
  initialJobs: ApplicationJob[];
}) {
  const [tab, setTab] = useState<Tab>("week");
  const [week, setWeek] = useState(29);

  const [shortlist, setShortlist] = useState<ApplicationJob[]>(() =>
    initialJobs.filter((j) => SHORTLIST_STATUSES.has(j.status)).sort(byScore),
  );
  const [assigned, setAssigned] = useState<ApplicationJob[]>(() =>
    initialJobs.filter((j) => ACTIVE_STATUSES.has(j.status)),
  );
  const history = useMemo(
    () => initialJobs.filter((j) => HISTORY_STATUSES.has(j.status)),
    [initialJobs],
  );

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [filled, setFilled] = useState(client.filledApps);

  // Search panel
  const prefs = client.preferences;
  const [sources, setSources] = useState<JobSource[]>(prefs?.sources ?? []);
  const [searching, setSearching] = useState(false);
  const [foundCount, setFoundCount] = useState<number | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    const t = timers.current;
    return () => t.forEach((id) => window.clearTimeout(id));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSource = useCallback((s: JobSource) => {
    setSources((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );
  }, []);

  const assignSelected = useCallback(() => {
    const picked = shortlist.filter((j) => selected.has(j.id));
    if (picked.length === 0) return;
    setShortlist((prev) => prev.filter((j) => !selected.has(j.id)));
    setAssigned((prev) => [
      ...picked.map((j) => ({
        ...j,
        status: "assigned" as JobStatus,
        assignedToId: client.ownerId,
        assignedToName: client.ownerName,
      })),
      ...prev,
    ]);
    setFilled((n) => n + picked.length);
    setSelected(new Set());
  }, [shortlist, selected, client.ownerId, client.ownerName]);

  const runSearch = useCallback(async () => {
    setSearching(true);
    setFoundCount(null);
    const candidates = await api.runSearch(client.id);
    const existing = new Set(shortlist.map((j) => j.id));
    const fresh = candidates.filter((c) => !existing.has(c.id));
    if (fresh.length === 0) {
      setSearching(false);
      setFoundCount(0);
      return;
    }
    // Stream results in one at a time to mimic a live background search.
    fresh.forEach((job, i) => {
      const t = window.setTimeout(
        () => {
          setShortlist((prev) => [...prev, job].sort(byScore));
          setNewIds((prev) => new Set(prev).add(job.id));
          if (i === fresh.length - 1) {
            setSearching(false);
            setFoundCount(fresh.length);
          }
        },
        (i + 1) * 450,
      );
      timers.current.push(t);
    });
  }, [client.id, shortlist]);

  const selectedCount = selected.size;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-panel-border px-8 py-5">
        <Link
          href="/admin/clients"
          className="text-[12px] text-muted transition-colors hover:text-zinc-200"
        >
          ← Clients
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-[18px] font-semibold">{client.name}</h1>
            <span className="text-[11px] uppercase tracking-[0.1em] text-muted">
              {client.tier}
            </span>
            <StageChip stage={client.stage} />
          </div>
          <div className="flex items-center gap-5">
            <QuotaMeter filled={filled} target={client.quotaApps} />
            <WeekSelector week={week} onChange={setWeek} />
          </div>
        </div>
      </header>

      {/* Body: content + search panel */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-8 py-6">
          <Tabs tab={tab} onChange={setTab} historyCount={history.length} />

          {tab === "week" && (
            <ThisWeek
              shortlist={shortlist}
              assigned={assigned}
              selected={selected}
              newIds={newIds}
              onToggle={toggleSelect}
            />
          )}
          {tab === "history" && <History jobs={history} />}
          {tab === "profile" && <Profile client={client} />}
        </div>

        <aside className="w-full shrink-0 border-t border-panel-border lg:w-[340px] lg:border-l lg:border-t-0">
          <SearchPanel
            client={client}
            sources={sources}
            onToggleSource={toggleSource}
            searching={searching}
            foundCount={foundCount}
            onRun={runSearch}
          />
        </aside>
      </div>

      {/* Assign action bar */}
      {selectedCount > 0 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between border-t border-panel-border bg-panel px-8 py-3">
          <p className="text-[13px] text-muted">
            <span className="font-semibold text-zinc-100">{selectedCount}</span>{" "}
            selected
          </p>
          <Button variant="primary" onClick={assignSelected}>
            Assign {selectedCount} to this week
          </Button>
        </div>
      )}
    </div>
  );
}

// ── This Week ─────────────────────────────────────────────────────────
function ThisWeek({
  shortlist,
  assigned,
  selected,
  newIds,
  onToggle,
}: {
  shortlist: ApplicationJob[];
  assigned: ApplicationJob[];
  selected: Set<string>;
  newIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-6 space-y-8">
      <section>
        <SectionHeading
          title="Shortlist"
          count={shortlist.length}
          hint="ranked by match score"
        />
        <Panel className="mt-3 divide-y divide-panel-border overflow-hidden">
          {shortlist.length === 0 ? (
            <Empty>Run a search to source jobs for this week.</Empty>
          ) : (
            shortlist.map((job) => (
              <ShortlistRow
                key={job.id}
                job={job}
                checked={selected.has(job.id)}
                isNew={newIds.has(job.id)}
                onToggle={() => onToggle(job.id)}
              />
            ))
          )}
        </Panel>
      </section>

      <section>
        <SectionHeading title="Assigned this week" count={assigned.length} />
        <Panel className="mt-3 divide-y divide-panel-border overflow-hidden">
          {assigned.length === 0 ? (
            <Empty>Nothing assigned yet.</Empty>
          ) : (
            assigned.map((job) => <ActiveRow key={job.id} job={job} />)
          )}
        </Panel>
      </section>
    </div>
  );
}

function ShortlistRow({
  job,
  checked,
  isNew,
  onToggle,
}: {
  job: ApplicationJob;
  checked: boolean;
  isNew: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-800/30">
      <input
        type="checkbox"
        checked={checked}
        onChange={onToggle}
        className="h-4 w-4 shrink-0 accent-[var(--accent)]"
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-[13px] font-medium text-zinc-100">
            {job.title}
          </p>
          {isNew && (
            <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_18%,transparent)] px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">
              New
            </span>
          )}
        </div>
        <p className="truncate text-[12px] text-muted">
          {job.company} · {job.location}
          {job.salary ? ` · ${job.salary}` : ""}
        </p>
      </div>
      <MatchScore score={job.matchScore} className="shrink-0" />
    </label>
  );
}

function ActiveRow({ job }: { job: ApplicationJob }) {
  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-medium text-zinc-100">
            {job.title}
          </p>
          <p className="truncate text-[12px] text-muted">
            {job.company} · {job.location}
          </p>
        </div>
        <MatchScore score={job.matchScore} className="shrink-0" />
        <StatusChip status={job.status} className="shrink-0" />
      </div>
      {/* Reasons are first-class (DESIGN.md rule 3) */}
      {job.reason && job.status === "blocked" && (
        <p className="mt-1.5 text-[11.5px] text-status-blocked">{job.reason}</p>
      )}
    </div>
  );
}

// ── History ───────────────────────────────────────────────────────────
function History({ jobs }: { jobs: ApplicationJob[] }) {
  if (jobs.length === 0)
    return <Empty className="mt-6">No history yet.</Empty>;
  return (
    <Panel className="mt-6 divide-y divide-panel-border overflow-hidden">
      {jobs.map((job) => (
        <div key={job.id} className="px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium text-zinc-300">
                {job.title}
              </p>
              <p className="truncate text-[12px] text-muted">
                {job.company} · {job.location}
              </p>
            </div>
            <StatusChip status={job.status} className="shrink-0" />
          </div>
          {job.reason && (
            <p className="mt-1.5 text-[11.5px] text-muted">
              <span className="text-status-rejected">Reason:</span> {job.reason}
            </p>
          )}
        </div>
      ))}
    </Panel>
  );
}

// ── Profile ───────────────────────────────────────────────────────────
function Profile({ client }: { client: Client }) {
  const p = client.preferences;
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2">
      <Panel className="p-5">
        <SectionLabel>Account</SectionLabel>
        <Field label="Owner" value={client.ownerName} />
        <Field label="Tier" value={client.tier} />
        <Field label="Stage" value={client.stage} />
        <Field label="Weekly quota" value={`${client.quotaApps} applications`} />
        <Field
          label="Client approval"
          value={client.approvalRequired ? "Required" : "Off"}
        />
      </Panel>
      <Panel className="p-5">
        <SectionLabel>Preferences</SectionLabel>
        {p ? (
          <>
            <Field label="Target titles" value={p.titles.join(", ")} />
            <Field label="Locations" value={p.locations.join(", ")} />
            <Field label="Work type" value={p.workType} />
            <Field label="Salary" value={salaryRange(p.salaryMin, p.salaryMax)} />
            <Field
              label="Sources"
              value={p.sources.map((s) => JOB_SOURCE_LABEL[s]).join(", ")}
            />
          </>
        ) : (
          <p className="mt-2 text-[12px] text-muted">
            No preferences yet — send the questionnaire or enter them manually.
          </p>
        )}
      </Panel>
    </div>
  );
}

// ── Search panel ──────────────────────────────────────────────────────
function SearchPanel({
  client,
  sources,
  onToggleSource,
  searching,
  foundCount,
  onRun,
}: {
  client: Client;
  sources: JobSource[];
  onToggleSource: (s: JobSource) => void;
  searching: boolean;
  foundCount: number | null;
  onRun: () => void;
}) {
  const p = client.preferences;
  return (
    <div className="p-5 lg:sticky lg:top-0">
      <h2 className="text-[13px] font-semibold">Search</h2>
      <p className="mt-1 text-[11.5px] text-muted">
        Pre-filled from {client.name.split(" ")[0]}&apos;s preferences.
      </p>

      {p && (
        <div className="mt-4 space-y-3">
          <Criteria label="Titles" values={p.titles} />
          <Criteria label="Locations" values={p.locations} />
          <div className="flex gap-6">
            <MiniField label="Work type" value={p.workType} />
            <MiniField
              label="Salary"
              value={salaryRange(p.salaryMin, p.salaryMax)}
            />
          </div>

          <div>
            <SectionLabel>Sources</SectionLabel>
            <div className="mt-2 space-y-1.5">
              {(Object.keys(JOB_SOURCE_LABEL) as JobSource[]).map((s) => (
                <label
                  key={s}
                  className="flex cursor-pointer items-center gap-2 text-[12.5px] text-zinc-300"
                >
                  <input
                    type="checkbox"
                    checked={sources.includes(s)}
                    onChange={() => onToggleSource(s)}
                    className="h-3.5 w-3.5 accent-[var(--accent)]"
                  />
                  {JOB_SOURCE_LABEL[s]}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      <Button
        variant="primary"
        className="mt-5 w-full"
        onClick={onRun}
        disabled={searching || sources.length === 0}
      >
        {searching ? "Searching…" : "Run search"}
      </Button>

      <div className="mt-3 min-h-[18px] text-[11.5px]">
        {searching && (
          <p className="text-muted">
            Running on {sources.map((s) => JOB_SOURCE_LABEL[s]).join(", ")} —
            results streaming into the shortlist…
          </p>
        )}
        {!searching && foundCount !== null && (
          <p className="text-status-offer">
            {foundCount > 0
              ? `${foundCount} new ${foundCount === 1 ? "match" : "matches"} added to the shortlist.`
              : "No new matches — try different sources or criteria."}
          </p>
        )}
        {!searching && foundCount === null && (
          <p className="text-zinc-500">
            Searches run in the background; you can leave this page.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Small pieces ──────────────────────────────────────────────────────
function Tabs({
  tab,
  onChange,
  historyCount,
}: {
  tab: Tab;
  onChange: (t: Tab) => void;
  historyCount: number;
}) {
  const items: { id: Tab; label: string }[] = [
    { id: "week", label: "This Week" },
    { id: "history", label: `History${historyCount ? ` (${historyCount})` : ""}` },
    { id: "profile", label: "Profile" },
  ];
  return (
    <div className="flex gap-1 border-b border-panel-border">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={
            "-mb-px border-b-2 px-3 py-2 text-[13px] transition-colors " +
            (tab === it.id
              ? "border-[var(--accent)] font-semibold text-zinc-100"
              : "border-transparent text-muted hover:text-zinc-200")
          }
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

function QuotaMeter({ filled, target }: { filled: number; target: number }) {
  const pct = target > 0 ? Math.min(1, filled / target) * 100 : 0;
  const short = target - filled;
  const color =
    short <= 0
      ? "var(--status-offer)"
      : short >= target / 2
        ? "var(--status-blocked)"
        : "var(--status-interview)";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-[0.1em] text-muted">
        Quota
      </span>
      <span
        className="h-1.5 w-24 overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--panel-border)" }}
      >
        <span
          className="block h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </span>
      <span className="font-mono text-[12px] tabular-nums text-zinc-200">
        {filled}/{target}
      </span>
    </div>
  );
}

function WeekSelector({
  week,
  onChange,
}: {
  week: number;
  onChange: (w: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        aria-label="Previous week"
        onClick={() => onChange(week - 1)}
        className="grid h-6 w-6 place-items-center rounded border border-panel-border text-muted hover:text-zinc-200"
      >
        ‹
      </button>
      <span className="min-w-[64px] text-center text-[12px] text-muted">
        Week {week}
      </span>
      <button
        aria-label="Next week"
        onClick={() => onChange(week + 1)}
        className="grid h-6 w-6 place-items-center rounded border border-panel-border text-muted hover:text-zinc-200"
      >
        ›
      </button>
    </div>
  );
}

function StageChip({ stage }: { stage: Client["stage"] }) {
  const color =
    stage === "active"
      ? "var(--status-offer)"
      : stage === "onboarding"
        ? "var(--status-review)"
        : stage === "paused"
          ? "var(--status-interview)"
          : "var(--status-expired)";
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
      }}
    >
      {stage}
    </span>
  );
}

function SectionHeading({
  title,
  count,
  hint,
}: {
  title: string;
  count: number;
  hint?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <h3 className="text-[13px] font-semibold">{title}</h3>
      <span className="font-mono text-[12px] tabular-nums text-muted">
        {count}
      </span>
      {hint && <span className="text-[11px] text-zinc-500">· {hint}</span>}
    </div>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
      {children}
    </p>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-2.5 flex items-baseline justify-between gap-4">
      <span className="text-[11.5px] text-muted">{label}</span>
      <span className="text-right text-[12.5px] capitalize text-zinc-200">
        {value}
      </span>
    </div>
  );
}

function MiniField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <p className="mt-1 text-[12.5px] capitalize text-zinc-200">{value}</p>
    </div>
  );
}

function Criteria({ label, values }: { label: string; values: string[] }) {
  return (
    <div>
      <SectionLabel>{label}</SectionLabel>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((v) => (
          <span
            key={v}
            className="rounded-md border border-panel-border px-2 py-0.5 text-[11.5px] text-zinc-300"
          >
            {v}
          </span>
        ))}
      </div>
    </div>
  );
}

function Empty({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={"px-4 py-6 text-center text-[12.5px] text-zinc-500 " + (className ?? "")}>
      {children}
    </p>
  );
}

function salaryRange(min?: number, max?: number) {
  const k = (n?: number) => (n ? `$${Math.round(n / 1000)}k` : "");
  if (!min && !max) return "—";
  return `${k(min)}–${k(max)}`;
}
