"use client";

// Team — manager/admin oversight of the JS/JA team: who carries what load, how
// their quota is filling, and their throughput. Serves the "assign and track
// members' work" requirement. Role-gated to manager + admin.

import { useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { AccessDenied } from "@/components/admin/access-denied";
import { MemberForm } from "@/components/admin/member-form";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { type TeamWorkload } from "@/lib/api";
import { canManageTeamMembers, isManagerPlus } from "@/lib/permissions";

export function TeamView({ workload }: { workload: TeamWorkload[] }) {
  const { user } = useCurrentUser();
  const { members: created, addMember } = useStore();
  const [adding, setAdding] = useState(false);
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
              setAdding(false);
            }}
            onCancel={() => setAdding(false)}
          />
        </div>
      )}

      {managers.length > 0 && (
        <Group title="Managers">
          {managers.map((w) => (
            <MemberCard key={w.member.id} w={w} />
          ))}
        </Group>
      )}

      <Group title="Job Application (JA)">
        {ja.map((w) => (
          <MemberCard key={w.member.id} w={w} />
        ))}
      </Group>

      <Group title="Job Sourcing (JS)">
        {js.map((w) => (
          <MemberCard key={w.member.id} w={w} />
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

function MemberCard({ w }: { w: TeamWorkload }) {
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
    <Panel className="p-4">
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
