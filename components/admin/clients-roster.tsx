"use client";

// Clients roster — fixtures + clients created in the UI (store), with stage
// overrides applied. Filter by name / stage / owner / quota risk, sort by name,
// quota fill, or last activity (09 Pages §Roster). Each row opens the
// workspace. "New client" (manager/admin) starts the onboarding wizard.

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  effectiveQuestionnaire,
  QuestionnaireStatusChip,
} from "@/components/admin/questionnaire-panel";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { Panel } from "@/components/ui/panel";
import {
  api,
  type ApplicationJob,
  type Client,
  type ClientStage,
  type QuestionnaireStatus,
} from "@/lib/api";
import { canCreateClient } from "@/lib/permissions";
import { CLIENT_STAGES, stageColor } from "@/lib/stage";

type SortKey = "name" | "quota" | "activity";

interface RosterEntry extends Client {
  pendingReview: number;
  lastActivity?: string; // ISO date of the newest job touch
}

// Quota risk: an active client with less than half their week filled.
const atRisk = (c: Client) =>
  c.stage === "active" && c.filledApps < c.quotaApps / 2;

export function ClientsRoster() {
  const { user } = useCurrentUser();
  const { clients: created, stageById, questionnaireById } = useStore();
  const [base, setBase] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<ApplicationJob[]>([]);

  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<ClientStage | "all">("all");
  const [owner, setOwner] = useState<string>("all");
  const [riskOnly, setRiskOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("name");

  useEffect(() => {
    api.getClients().then(setBase);
    api.getJobs().then(setJobs);
  }, []);

  const clients: RosterEntry[] = useMemo(() => {
    return [...created, ...base].map((c) => {
      const mine = jobs.filter((j) => j.clientId === c.id);
      return {
        ...c,
        stage: stageById[c.id] ?? c.stage,
        pendingReview: mine.filter((j) => j.status === "client_review").length,
        lastActivity: mine.reduce<string | undefined>(
          (max, j) => (!max || j.updatedAt > max ? j.updatedAt : max),
          undefined,
        ),
      };
    });
  }, [created, base, jobs, stageById]);

  const owners = useMemo(() => {
    const seen = new Map<string, string>();
    clients.forEach((c) => seen.set(c.ownerId, c.ownerName));
    return [...seen.entries()];
  }, [clients]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = clients.filter(
      (c) =>
        (!q || c.name.toLowerCase().includes(q)) &&
        (stage === "all" || c.stage === stage) &&
        (owner === "all" || c.ownerId === owner) &&
        (!riskOnly || atRisk(c)),
    );
    if (sort === "name") rows.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "quota")
      rows.sort(
        (a, b) => a.filledApps / (a.quotaApps || 1) - b.filledApps / (b.quotaApps || 1),
      );
    if (sort === "activity")
      rows.sort((a, b) => (b.lastActivity ?? "").localeCompare(a.lastActivity ?? ""));
    return rows;
  }, [clients, query, stage, owner, riskOnly, sort]);

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6 flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Clients
          </p>
          <h1 className="mt-1 text-[20px] font-semibold text-zinc-100">Roster</h1>
          <p className="mt-1.5 text-xs text-muted leading-relaxed max-w-xl">
            Monitor client pipelines, active application quotas, and onboarding progress. Click any row to open the client's workspace dashboard.
          </p>
        </div>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="font-mono text-[12px] tabular-nums text-muted">
            {visible.length}/{clients.length} clients
          </span>
          {canCreateClient(user) && (
            <Link
              href="/admin/clients/new"
              className="rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[var(--accent-strong)]"
            >
              + New client
            </Link>
          )}
        </div>
      </header>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name…"
          className="h-8 w-44 rounded-md border border-panel-border bg-panel px-2.5 text-[12px] text-zinc-200 outline-none placeholder:text-zinc-500 focus:border-zinc-600"
        />
        <select
          value={stage}
          onChange={(e) => setStage(e.target.value as ClientStage | "all")}
          aria-label="Filter by stage"
          className="h-8 rounded-md border border-panel-border bg-panel px-2 text-[12px] capitalize text-zinc-200 outline-none focus:border-zinc-600"
        >
          <option value="all">All stages</option>
          {CLIENT_STAGES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          aria-label="Filter by assignee"
          className="h-8 rounded-md border border-panel-border bg-panel px-2 text-[12px] text-zinc-200 outline-none focus:border-zinc-600"
        >
          <option value="all">All assignees</option>
          {owners.map(([id, name]) => (
            <option key={id} value={id}>
              {name}
            </option>
          ))}
        </select>
        <button
          onClick={() => setRiskOnly((v) => !v)}
          className={
            "h-8 rounded-md border px-2.5 text-[12px] font-semibold transition-colors " +
            (riskOnly
              ? "border-status-blocked/60 bg-status-blocked/10 text-status-blocked"
              : "border-panel-border text-muted hover:text-zinc-200")
          }
        >
          Quota risk
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Sort"
          className="ml-auto h-8 rounded-md border border-panel-border bg-panel px-2 text-[12px] text-zinc-200 outline-none focus:border-zinc-600"
        >
          <option value="name">Sort: name</option>
          <option value="quota">Sort: quota fill</option>
          <option value="activity">Sort: last activity</option>
        </select>
      </div>

      <Panel className="overflow-hidden">
        <div className="grid grid-cols-[1fr_80px_70px_70px] sm:grid-cols-[1fr_120px_90px_70px_70px] md:grid-cols-[1fr_120px_90px_70px_70px_100px] items-center gap-4 border-b border-panel-border px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          <span>Client</span>
          <span className="hidden sm:block">Assignee</span>
          <span>Stage</span>
          <span className="text-right">Review</span>
          <span className="text-right">Quota</span>
          <span className="hidden md:block text-right">Activity</span>
        </div>
        <div className="divide-y divide-panel-border">
          {visible.length === 0 ? (
            <p className="px-4 py-6 text-center text-[12.5px] text-zinc-500">
              No clients match these filters.
            </p>
          ) : (
            visible.map((c) => (
              <RosterRow
                key={c.id}
                client={c}
                qStatus={effectiveQuestionnaire(c, questionnaireById).status}
              />
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}

function RosterRow({
  client: c,
  qStatus,
}: {
  client: RosterEntry;
  qStatus: QuestionnaireStatus;
}) {
  const risk = atRisk(c);
  return (
    <Link
      href={`/admin/clients/${c.id}`}
      className="grid grid-cols-[1fr_80px_70px_70px] sm:grid-cols-[1fr_120px_90px_70px_70px] md:grid-cols-[1fr_120px_90px_70px_70px_100px] items-center gap-4 px-4 py-3 transition-colors hover:bg-panel-border/30"
    >
      <div className="min-w-0">
        <p className="truncate text-[13px] font-medium text-zinc-100">{c.name}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[11px] text-muted">{c.tier}</span>
          {c.stage === "onboarding" && (
            <span className="flex items-center gap-1 text-[10px] text-muted">
              · Questionnaire <QuestionnaireStatusChip status={qStatus} />
            </span>
          )}
        </div>
      </div>
      <span className="hidden whitespace-nowrap text-[12px] text-muted sm:block">
        {c.ownerName}
      </span>
      <StageChip stage={c.stage} />
      <span
        className={
          "text-right font-mono text-[12px] tabular-nums " +
          (c.pendingReview > 0 ? "text-status-review" : "text-zinc-600")
        }
      >
        {c.pendingReview || "—"}
      </span>
      <span
        className={
          "text-right font-mono text-[12px] tabular-nums " +
          (risk ? "text-status-interview" : "text-zinc-300")
        }
      >
        {c.filledApps}/{c.quotaApps}
      </span>
      <span className="hidden whitespace-nowrap text-right font-mono text-[11px] tabular-nums text-zinc-500 md:block">
        {c.lastActivity ?? "—"}
      </span>
    </Link>
  );
}

function StageChip({ stage }: { stage: Client["stage"] }) {
  const color = stageColor(stage);
  return (
    <span
      className="justify-self-start rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
    >
      {stage}
    </span>
  );
}
