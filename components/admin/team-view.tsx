"use client";

// Team — manager/admin oversight of the JS/JA team: who carries what load, how
// their quota is filling, and their throughput. Serves the "assign and track
// members' work" requirement. Role-gated to manager + admin.

import Link from "next/link";
import { useEffect, useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { AccessDenied } from "@/components/admin/access-denied";
import { MemberForm } from "@/components/admin/member-form";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import {
  api,
  STATUS_META,
  type ApplicationJob,
  type Client,
  type JobStatus,
  type TeamWorkload,
} from "@/lib/api";
import { canManageTeamMembers, isManagerPlus } from "@/lib/permissions";

export function TeamView({ workload }: { workload: TeamWorkload[] }) {
  const { user } = useCurrentUser();
  const { members: created, addMember, logAudit } = useStore();
  const [adding, setAdding] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Drill-down data: the member's clients + jobs (fetched once, filtered per
  // selection).
  const [clients, setClients] = useState<Client[]>([]);
  const [jobs, setJobs] = useState<ApplicationJob[]>([]);
  useEffect(() => {
    api.getClients().then(setClients);
    api.getJobs().then(setJobs);
  }, []);

  if (!isManagerPlus(user)) return <AccessDenied need="managers and admins" />;

  // Members invited in the UI start with an empty workload.
  const extra: TeamWorkload[] = created.map((member) => ({
    member,
    clientCount: 0,
    quotaFilled: 0,
    quotaTarget: 0,
    activeJobs: 0,
    applied: 0,
    interviewing: 0,
    offers: 0,
    stale: 0,
  }));
  const all = [...extra, ...workload];

  const js = all.filter((w) => w.member.memberType === "js");
  const ja = all.filter((w) => w.member.memberType === "ja");
  const managers = all.filter((w) => w.member.role === "manager");

  const selected = all.find((w) => w.member.id === selectedId) ?? null;
  const toggle = (id: string) =>
    setSelectedId((cur) => (cur === id ? null : id));

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Team
          </p>
          <h1 className="mt-1 text-[16px] font-semibold">Workload & oversight</h1>
          <p className="mt-1 text-[13px] text-muted">
            {ja.length} JA · {js.length} JS · {managers.length} manager
            {managers.length === 1 ? "" : "s"}
          </p>
        </div>
        {canManageTeamMembers(user) && !adding && (
          <Button variant="primary" size="sm" onClick={() => setAdding(true)}>
            New team member
          </Button>
        )}
      </header>

      {canManageTeamMembers(user) && adding && (
        <div className="mb-8">
          <MemberForm
            user={user}
            onCreate={(m) => {
              addMember(m);
              logAudit(user.name, "Created team member", m.name);
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {selected && (
        <MemberDetail
          w={selected}
          clients={clients.filter((c) => c.ownerId === selected.member.id)}
          jobs={jobs.filter((j) => j.assignedToId === selected.member.id)}
          onClose={() => setSelectedId(null)}
        />
      )}

      {managers.length > 0 && (
        <Group title="Managers">
          {managers.map((w) => (
            <MemberCard
              key={w.member.id}
              w={w}
              selected={selectedId === w.member.id}
              onSelect={() => toggle(w.member.id)}
            />
          ))}
        </Group>
      )}

      <Group title="Job Application (JA)">
        {ja.map((w) => (
          <MemberCard
            key={w.member.id}
            w={w}
            selected={selectedId === w.member.id}
            onSelect={() => toggle(w.member.id)}
          />
        ))}
      </Group>

      <Group title="Job Sourcing (JS)">
        {js.map((w) => (
          <MemberCard
            key={w.member.id}
            w={w}
            selected={selectedId === w.member.id}
            onSelect={() => toggle(w.member.id)}
          />
        ))}
      </Group>
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

function MemberCard({
  w,
  selected,
  onSelect,
}: {
  w: TeamWorkload;
  selected: boolean;
  onSelect: () => void;
}) {
  const { member } = w;
  const initials = member.name
    .replace(".", "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const overloaded = w.clientCount > member.capacity;
  const isJS = member.memberType === "js";

  return (
    <Panel
      role="button"
      tabIndex={0}
      aria-expanded={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      className={
        "cursor-pointer p-4 transition-colors hover:border-zinc-600 " +
        (selected ? "border-[var(--accent)]" : "")
      }
    >
      <div className="flex items-center gap-2.5">
        <span className="grid h-8 w-8 place-items-center rounded-full bg-zinc-800 text-[11px] font-semibold text-zinc-300">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-zinc-100">
            {member.name}
          </p>
          <p className="text-[10px] uppercase tracking-[0.1em] text-muted">
            {member.role === "manager"
              ? "Manager"
              : isJS
                ? "JS member"
                : "JA member"}
          </p>
        </div>
        {w.stale > 0 && (
          <span className="ml-auto rounded-full bg-status-interview/15 px-1.5 py-0.5 text-[10px] font-semibold text-status-interview">
            {w.stale} stale
          </span>
        )}
      </div>

      {/* Client load vs capacity */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Clients</span>
          <span className="font-mono tabular-nums text-zinc-300">
            {w.clientCount}/{member.capacity}
          </span>
        </div>
        <Bar
          value={member.capacity ? w.clientCount / member.capacity : 0}
          color={overloaded ? "var(--status-blocked)" : "var(--accent)"}
        />
      </div>

      {/* Quota fill across owned clients */}
      {w.quotaTarget > 0 && (
        <div className="mt-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Weekly quota</span>
            <span className="font-mono tabular-nums text-zinc-300">
              {w.quotaFilled}/{w.quotaTarget}
            </span>
          </div>
          <Bar
            value={w.quotaTarget ? w.quotaFilled / w.quotaTarget : 0}
            color="var(--status-offer)"
          />
        </div>
      )}

      {/* Throughput */}
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[11.5px]">
        {isJS ? (
          <Stat label="Sourced this week" value={member.sourcedThisWeek ?? 0} />
        ) : (
          <>
            <Stat label="Active" value={w.activeJobs} />
            <Stat label="Applied" value={w.applied} />
            <Stat label="Interviewing" value={w.interviewing} />
            <Stat label="Offers" value={w.offers} />
          </>
        )}
      </div>
    </Panel>
  );
}

// Drill-down: the member's clients, their assigned jobs by status, and recent
// activity (09 Pages §Team).
const DETAIL_STATUS_ORDER: JobStatus[] = [
  "assigned",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "blocked",
  "in_progress",
  "closed",
  "expired",
  "rejected",
];

function MemberDetail({
  w,
  clients,
  jobs,
  onClose,
}: {
  w: TeamWorkload;
  clients: Client[];
  jobs: ApplicationJob[];
  onClose: () => void;
}) {
  const { member } = w;
  const byStatus = DETAIL_STATUS_ORDER.map(
    (s) => [s, jobs.filter((j) => j.status === s)] as const,
  ).filter(([, list]) => list.length > 0);
  const recent = [...jobs]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  return (
    <Panel className="mb-8 p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-semibold text-zinc-100">
            {member.name}
          </h2>
          <p className="mt-0.5 text-[11px] uppercase tracking-[0.1em] text-muted">
            {member.role === "manager"
              ? "Manager"
              : member.memberType === "js"
                ? "JS member"
                : "JA member"}{" "}
            · {clients.length} client{clients.length === 1 ? "" : "s"} ·{" "}
            {jobs.length} assigned job{jobs.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button size="sm" onClick={onClose}>
          Close
        </Button>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-3">
        {/* Their clients */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Clients
          </h3>
          {clients.length === 0 ? (
            <p className="text-[12px] text-zinc-500">No owned clients.</p>
          ) : (
            <div className="space-y-1">
              {clients.map((c) => (
                <Link
                  key={c.id}
                  href={`/admin/clients/${c.id}`}
                  className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-800/40"
                >
                  <span className="truncate text-[12.5px] text-zinc-200">
                    {c.name}
                  </span>
                  <span className="font-mono text-[11px] tabular-nums text-muted">
                    {c.filledApps}/{c.quotaApps}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Assigned jobs by status */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Assigned jobs by status
          </h3>
          {byStatus.length === 0 ? (
            <p className="text-[12px] text-zinc-500">No assigned jobs.</p>
          ) : (
            <div className="space-y-1.5">
              {byStatus.map(([status, list]) => (
                <div key={status} className="flex items-center justify-between gap-3">
                  <StatusChip status={status} />
                  <span className="font-mono text-[12px] tabular-nums text-zinc-300">
                    {list.length}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Recent activity
          </h3>
          {recent.length === 0 ? (
            <p className="text-[12px] text-zinc-500">Nothing yet.</p>
          ) : (
            <div className="space-y-1.5">
              {recent.map((j) => (
                <div key={j.id} className="min-w-0">
                  <p className="truncate text-[12px] text-zinc-200">
                    {j.title} · {j.company}
                  </p>
                  <p className="text-[10.5px] text-muted">
                    {STATUS_META[j.status].label} · {j.clientName} ·{" "}
                    <span className="font-mono tabular-nums">{j.updatedAt}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </Panel>
  );
}

function Bar({ value, color }: { value: number; color: string }) {
  const pct = Math.min(1, Math.max(0, value)) * 100;
  return (
    <span
      className="mt-1 block h-1.5 w-full overflow-hidden rounded-full"
      style={{ backgroundColor: "var(--panel-border)" }}
    >
      <span
        className="block h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </span>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <span className="text-muted">
      {label}{" "}
      <span className="font-mono tabular-nums text-zinc-200">{value}</span>
    </span>
  );
}
