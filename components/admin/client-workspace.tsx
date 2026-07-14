"use client";

// Client Workspace — the core internal screen (06 UX). The unit of work is a
// client-week: get this client their N jobs and keep applications moving.
// Search is NOT a portal feature (note 09) — jobs are ADDED or IMPORTED via the
// right-hand panel, then sent to review / assigned. Role-aware: members edit
// only owned clients; managers assign; JS/owners send to review.

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AddJobsForm } from "@/components/admin/add-jobs-form";
import {
  effectiveQuestionnaire,
  QuestionnairePanel,
} from "@/components/admin/questionnaire-panel";
import { SourcingPreferences } from "@/components/admin/sourcing-preferences";
import { useCurrentUser } from "@/components/shell/role-context";
import { effectiveDocuments, useStore } from "@/components/shell/store-context";
import { Button } from "@/components/ui/button";
import { CommentCount } from "@/components/ui/job-comments";
import { JobDetailModal } from "@/components/ui/job-detail-modal";
import { MatchScore } from "@/components/ui/match-score";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import {
  api,
  DOCUMENT_KIND_LABEL,
  DOCUMENT_KINDS,
  QUESTIONNAIRE_LABEL,
  REJECT_CATEGORY_LABEL,
  type ApplicationJob,
  type Client,
  type ClientDocument,
  type ClientStage,
  type DocumentKind,
  type JobStatus,
  type QuestionnaireStatus,
  type RejectCategory,
} from "@/lib/api";
import {
  canAddJobs,
  canAssign,
  canEditClient,
  canManageStage,
} from "@/lib/permissions";
import { CLIENT_STAGES, stageColor } from "@/lib/stage";

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
  (b.matchScore ?? 0) - (a.matchScore ?? 0);

type Tab = "week" | "history" | "profile" | "documents";

export function ClientWorkspace({
  client,
  initialJobs,
}: {
  client: Client;
  initialJobs: ApplicationJob[];
}) {
  const { user } = useCurrentUser();
  const {
    stageById,
    setStage,
    questionnaireById,
    sendQuestionnaire,
    documentsById,
    upsertDocument,
    assignJob,
    setJobStatus,
    logAudit,
  } = useStore();
  const editable = canEditClient(user, client.ownerId);
  const managerish = canAssign(user);
  const stage = stageById[client.id] ?? client.stage;
  const questionnaire = effectiveQuestionnaire(client, questionnaireById);

  const [tab, setTab] = useState<Tab>("profile");
  const [week, setWeek] = useState(29);

  // Documents: fixture base merged with uploads/replacements from the store.
  const [baseDocs, setBaseDocs] = useState<ClientDocument[]>([]);
  useEffect(() => {
    api.getDocuments(client.id).then(setBaseDocs);
  }, [client.id]);
  const docs = effectiveDocuments(baseDocs, documentsById[client.id]);

  const handleUpload = useCallback(
    (kind: DocumentKind, fileName: string) => {
      upsertDocument(client.id, kind, fileName, user.name);
      logAudit(
        user.name,
        `Uploaded ${DOCUMENT_KIND_LABEL[kind].toLowerCase()}`,
        client.name,
      );
    },
    [client.id, client.name, upsertDocument, logAudit, user.name],
  );

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

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAdd = useCallback((jobs: ApplicationJob[]) => {
    setShortlist((prev) => {
      const have = new Set(prev.map((j) => j.id));
      const fresh = jobs.filter((j) => !have.has(j.id));
      setNewIds((n) => {
        const next = new Set(n);
        fresh.forEach((j) => next.add(j.id));
        return next;
      });
      return [...prev, ...fresh].sort(byScore);
    });
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
    // Persist: assign each to the client's owner (also mirrors into the shared
    // overlay so the pipeline reflects the move).
    picked.forEach((j) => assignJob(j.id, client.ownerId));
  }, [shortlist, selected, client.ownerId, client.ownerName, assignJob]);

  const sendToReview = useCallback(() => {
    if (selected.size === 0) return;
    const toReview = shortlist.filter((j) => selected.has(j.id) && j.status === "sourced");
    setShortlist((prev) =>
      prev
        .map((j) =>
          selected.has(j.id) && j.status === "sourced"
            ? { ...j, status: "client_review" as JobStatus }
            : j,
        )
        .sort(byScore),
    );
    setSelected(new Set());
    toReview.forEach((j) => setJobStatus(j.id, "client_review"));
  }, [selected, shortlist, setJobStatus]);

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
            <StageControl
              stage={stage}
              editable={canManageStage(user)}
              onChange={(s) => {
                setStage(client.id, s);
                logAudit(user.name, `Changed stage to ${s}`, client.name);
              }}
            />
            {!editable && (
              <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-semibold text-zinc-400">
                View only
              </span>
            )}
          </div>
          <div className="flex items-center gap-5">
            <span className="text-[11px] text-muted">
              Owner <span className="text-zinc-300">{client.ownerName}</span>
            </span>
            <QuotaMeter filled={filled} target={client.quotaApps} />
            <WeekSelector week={week} onChange={setWeek} />
          </div>
        </div>
      </header>

      {/* Onboarding checklist — visible while the client is being set up */}
      {stage === "onboarding" && (
        <OnboardingBanner
          client={client}
          qStatus={questionnaire.status}
          docsDone={docs.some((d) => d.kind === "resume")}
          canManage={canManageStage(user)}
          onSend={() => {
            sendQuestionnaire(client.id);
            logAudit(user.name, "Sent questionnaire", client.name);
          }}
          onActivate={() => {
            setStage(client.id, "active");
            logAudit(user.name, "Changed stage to active", client.name);
          }}
        />
      )}

      {/* Body */}
      <div className="flex flex-1 flex-col lg:flex-row">
        <div className="min-w-0 flex-1 px-8 py-6">
          <Tabs tab={tab} onChange={setTab} historyCount={history.length} />

          {tab === "week" && (
            <ThisWeek
              shortlist={shortlist}
              assigned={assigned}
              selected={selected}
              newIds={newIds}
              selectable={editable}
              author={user.name}
              onToggle={toggleSelect}
            />
          )}
          {tab === "history" && <History jobs={history} clientName={client.name} />}
          {tab === "profile" && <Profile client={client} />}
          {tab === "documents" && (
            <Documents docs={docs} editable={editable} onUpload={handleUpload} />
          )}
        </div>

        {/* Right panel: Add jobs (search is gone) */}
        <aside className="w-full shrink-0 border-t border-panel-border lg:w-[340px] lg:border-l lg:border-t-0">
          <div className="p-5 lg:sticky lg:top-0">
            <h2 className="text-[13px] font-semibold">Add jobs</h2>
            <p className="mt-1 text-[11.5px] text-muted">
              Sourced outside the portal — add one or import a batch.
            </p>
            <div className="mt-4">
              {editable && canAddJobs(user) ? (
                <AddJobsForm
                  clientId={client.id}
                  clientName={client.name}
                  onAdd={handleAdd}
                />
              ) : (
                <p className="text-[12px] text-zinc-500">
                  You can view this client but not edit it. Only the owner (
                  {client.ownerName}) and managers can add jobs.
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* Action bar */}
      {editable && selectedCount > 0 && (
        <div className="sticky bottom-0 z-10 flex items-center justify-between gap-3 border-t border-panel-border bg-panel px-8 py-3">
          <p className="text-[13px] text-muted">
            <span className="font-semibold text-zinc-100">{selectedCount}</span>{" "}
            selected
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={sendToReview}>
              Send to review
            </Button>
            {managerish && (
              <Button variant="primary" onClick={assignSelected}>
                Assign {selectedCount} to this week
              </Button>
            )}
          </div>
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
  selectable,
  author,
  onToggle,
}: {
  shortlist: ApplicationJob[];
  assigned: ApplicationJob[];
  selected: Set<string>;
  newIds: Set<string>;
  selectable: boolean;
  author: string;
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
            <Empty>Add or import jobs to build this week&apos;s shortlist.</Empty>
          ) : (
            shortlist.map((job) => (
              <ShortlistRow
                key={job.id}
                job={job}
                checked={selected.has(job.id)}
                isNew={newIds.has(job.id)}
                selectable={selectable}
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
            assigned.map((job) => (
              <ActiveRow key={job.id} job={job} author={author} />
            ))
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
  selectable,
  onToggle,
}: {
  job: ApplicationJob;
  checked: boolean;
  isNew: boolean;
  selectable: boolean;
  onToggle: () => void;
}) {
  return (
    <label
      className={
        "flex items-center gap-3 px-4 py-3 transition-colors " +
        (selectable ? "cursor-pointer hover:bg-zinc-800/30" : "")
      }
    >
      {selectable && (
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 shrink-0 accent-[var(--accent)]"
        />
      )}
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
      <StatusChip status={job.status} className="shrink-0" />
      <MatchScore score={job.matchScore} className="shrink-0" />
    </label>
  );
}

function ActiveRow({ job, author }: { job: ApplicationJob; author: string }) {
  const [detail, setDetail] = useState(false);
  return (
    <>
      <div
        className="cursor-pointer px-4 py-3 transition-colors hover:bg-zinc-800/30"
        onClick={() => setDetail(true)}
        title="Click for details & comments"
      >
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-medium text-zinc-100">
              {job.title}
            </p>
            <p className="truncate text-[12px] text-muted">
              {job.company} · {job.location}
            </p>
          </div>
          <CommentCount jobId={job.id} />
          <MatchScore score={job.matchScore} className="shrink-0" />
          <StatusChip status={job.status} className="shrink-0" />
        </div>
        {job.reason && job.status === "blocked" && (
          <p className="mt-1.5 text-[11.5px] text-status-blocked">{job.reason}</p>
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

// ── History ───────────────────────────────────────────────────────────
function History({
  jobs,
  clientName,
}: {
  jobs: ApplicationJob[];
  clientName: string;
}) {
  if (jobs.length === 0) return <Empty className="mt-6">No history yet.</Empty>;
  return (
    <div className="mt-6 space-y-4">
      <TastePanel jobs={jobs} clientName={clientName} />
      <HistoryList jobs={jobs} />
    </div>
  );
}

// Client-taste panel — rejection categories aggregated so sourcing can steer
// away from what the client declines (09 Pages §Client Workspace History).
function TastePanel({
  jobs,
  clientName,
}: {
  jobs: ApplicationJob[];
  clientName: string;
}) {
  const rejected = jobs.filter((j) => j.status === "rejected");
  if (rejected.length === 0) return null;

  const counts = new Map<RejectCategory, number>();
  for (const j of rejected) {
    const cat = j.rejectCategory ?? "other";
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]);
  const max = ranked[0]?.[1] ?? 1;

  return (
    <Panel className="p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-[13px] font-semibold">Client taste</h3>
        <span className="font-mono text-[12px] tabular-nums text-muted">
          {rejected.length} rejected
        </span>
      </div>
      <p className="mt-1 text-[11.5px] text-muted">
        Why {clientName} declines jobs — steer sourcing away from these.
      </p>
      <div className="mt-3 space-y-2">
        {ranked.map(([cat, count]) => (
          <div key={cat} className="flex items-center gap-3">
            <span className="w-36 shrink-0 text-[12px] text-zinc-300">
              {REJECT_CATEGORY_LABEL[cat]}
            </span>
            <span
              className="h-1.5 flex-1 overflow-hidden rounded-full"
              style={{ backgroundColor: "var(--panel-border)" }}
            >
              <span
                className="block h-full rounded-full"
                style={{
                  width: `${(count / max) * 100}%`,
                  backgroundColor: "var(--status-rejected)",
                }}
              />
            </span>
            <span className="w-6 text-right font-mono text-[12px] tabular-nums text-zinc-300">
              {count}
            </span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function HistoryList({ jobs }: { jobs: ApplicationJob[] }) {
  return (
    <Panel className="divide-y divide-panel-border overflow-hidden">
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
  return (
    <div className="mt-6 space-y-4">
      <Panel className="p-5">
        <QuestionnairePanel client={client} />
      </Panel>
      <div className="grid items-start gap-4 sm:grid-cols-2">
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
          <SourcingPreferences client={client} />
        </Panel>
      </div>
    </div>
  );
}

// ── Documents ─────────────────────────────────────────────────────────
// Upload/replace stores the file name only (files are mocked until the
// backend); download stays disabled for the same reason.
function Documents({
  docs,
  editable,
  onUpload,
}: {
  docs: ClientDocument[];
  editable: boolean;
  onUpload: (kind: DocumentKind, fileName: string) => void;
}) {
  const byKind = new Map(docs.map((d) => [d.kind, d]));
  return (
    <div className="mt-6">
      <Panel className="divide-y divide-panel-border overflow-hidden">
        {DOCUMENT_KINDS.map((kind) => (
          <DocumentRow
            key={kind}
            kind={kind}
            doc={byKind.get(kind)}
            editable={editable}
            onUpload={onUpload}
          />
        ))}
      </Panel>
      <p className="mt-3 text-[11.5px] text-zinc-500">
        Files are mocked until the backend lands — uploads keep the file name
        only, and download activates then.
      </p>
    </div>
  );
}

function DocumentRow({
  kind,
  doc,
  editable,
  onUpload,
}: {
  kind: DocumentKind;
  doc?: ClientDocument;
  editable: boolean;
  onUpload: (kind: DocumentKind, fileName: string) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-zinc-100">
          {DOCUMENT_KIND_LABEL[kind]}
        </p>
        {doc ? (
          <p className="mt-0.5 truncate text-[11.5px] text-muted">
            {doc.fileName} · {doc.uploadedAt}
            {doc.uploadedBy ? ` · ${doc.uploadedBy}` : ""}
          </p>
        ) : (
          <p className="mt-0.5 text-[11.5px] text-zinc-500">Not on file</p>
        )}
      </div>
      {doc ? (
        <span className="rounded-full bg-status-offer/15 px-2 py-0.5 text-[10px] font-semibold text-status-offer">
          Uploaded
        </span>
      ) : (
        <span className="rounded-full border border-panel-border px-2 py-0.5 text-[10px] font-semibold text-muted">
          Missing
        </span>
      )}
      {doc && (
        <Button size="sm" disabled title="Available with the backend">
          Download
        </Button>
      )}
      {editable && (
        <>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onUpload(kind, f.name);
              e.target.value = "";
            }}
          />
          <Button size="sm" onClick={() => fileRef.current?.click()}>
            {doc ? "Replace" : "Upload"}
          </Button>
        </>
      )}
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
    { id: "profile", label: "Profile" },
    { id: "week", label: "This Week" },
    { id: "history", label: `History${historyCount ? ` (${historyCount})` : ""}` },
    { id: "documents", label: "Documents" },
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

function StageControl({
  stage,
  editable,
  onChange,
}: {
  stage: ClientStage;
  editable: boolean;
  onChange: (s: ClientStage) => void;
}) {
  const color = stageColor(stage);
  if (!editable) {
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
  return (
    <select
      value={stage}
      onChange={(e) => onChange(e.target.value as ClientStage)}
      className="rounded-full border-0 px-2 py-0.5 text-[10px] font-semibold capitalize outline-none"
      style={{
        color,
        backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)`,
      }}
      aria-label="Client stage"
    >
      {CLIENT_STAGES.map((s) => (
        <option key={s} value={s} className="bg-panel text-zinc-200">
          {s}
        </option>
      ))}
    </select>
  );
}

function OnboardingBanner({
  client,
  qStatus,
  docsDone,
  canManage,
  onSend,
  onActivate,
}: {
  client: Client;
  qStatus: QuestionnaireStatus;
  docsDone: boolean;
  canManage: boolean;
  onSend: () => void;
  onActivate: () => void;
}) {
  const sent = qStatus !== "not_sent";
  const done = qStatus === "completed";
  return (
    <div className="border-b border-panel-border bg-[color-mix(in_srgb,var(--status-review)_8%,transparent)] px-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[13px] font-semibold text-zinc-100">
            Onboarding {client.name}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
            <Check done label="Client info" />
            <Check done={docsDone} label="Documents" />
            <Check
              done={done}
              label={`Questionnaire: ${QUESTIONNAIRE_LABEL[qStatus]}`}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onSend}
            disabled={sent || !canManage}
          >
            {sent ? "Questionnaire sent" : "Send questionnaire"}
          </Button>
          {canManage && (
            <Button variant="primary" size="sm" onClick={onActivate}>
              Move to Active
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="grid h-4 w-4 place-items-center rounded-full text-[9px] font-bold"
        style={{
          color: done ? "var(--status-offer)" : "var(--muted)",
          backgroundColor: done
            ? "color-mix(in srgb, var(--status-offer) 20%, transparent)"
            : "var(--panel-border)",
        }}
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-zinc-300" : "text-muted"}>{label}</span>
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

function Empty({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={
        "px-4 py-6 text-center text-[12.5px] text-zinc-500 " + (className ?? "")
      }
    >
      {children}
    </p>
  );
}
