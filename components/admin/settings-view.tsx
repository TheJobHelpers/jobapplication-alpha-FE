"use client";

// Admin — staff, quotas/tiers, sources & import templates, and the audit log.
// Admin-only (managers don't see it in nav; gated here too). Forms are mock.

import { useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { AccessDenied } from "@/components/admin/access-denied";
import { MemberForm } from "@/components/admin/member-form";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import {
  JOB_SOURCE_LABEL,
  type AuditEntry,
  type JobSource,
  type TeamMember,
} from "@/lib/api";
import { isAdmin } from "@/lib/permissions";

const TIERS = [
  { tier: "Tier 1", quota: 12, note: "Priority — highest weekly volume" },
  { tier: "Tier 2", quota: 10, note: "Standard" },
  { tier: "Tier 3", quota: 8, note: "Light touch" },
];

export function SettingsView({
  team,
  audit,
}: {
  team: TeamMember[];
  audit: AuditEntry[];
}) {
  const { user } = useCurrentUser();
  if (!isAdmin(user)) return <AccessDenied need="admins" />;

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Admin
        </p>
        <h1 className="mt-1 text-[16px] font-semibold">Settings & audit</h1>
      </header>

      <div className="space-y-6">
        <StaffSection team={team} />
        <QuotaSection />
        <SourcesSection />
        <AuditSection audit={audit} />
      </div>
    </div>
  );
}

function roleLabel(m: TeamMember) {
  if (m.role === "admin") return "Admin";
  if (m.role === "manager") return "Manager";
  return m.memberType === "js" ? "JS member" : "JA member";
}

function StaffSection({ team }: { team: TeamMember[] }) {
  const { user } = useCurrentUser();
  const { members: created, addMember } = useStore();
  const [inviting, setInviting] = useState(false);
  const all = [...created, ...team];

  return (
    <Section
      title="Staff"
      action={
        <Button size="sm" onClick={() => setInviting((v) => !v)}>
          {inviting ? "Close" : "Invite member"}
        </Button>
      }
    >
      {inviting && (
        <div className="mb-3">
          <MemberForm
            user={user}
            onCreate={(m) => {
              addMember(m);
              setInviting(false);
            }}
            onCancel={() => setInviting(false)}
          />
        </div>
      )}
      <div className="divide-y divide-panel-border">
        {all.map((m) => (
          <div key={m.id} className="flex items-center gap-4 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-zinc-100">{m.name}</p>
              <p className="text-[11px] text-muted">{roleLabel(m)}</p>
            </div>
            {m.capacity > 0 && (
              <span className="font-mono text-[11px] tabular-nums text-zinc-500">
                cap {m.capacity}
              </span>
            )}
            <span className="rounded-full bg-status-offer/15 px-2 py-0.5 text-[10px] font-semibold text-status-offer">
              Active
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function QuotaSection() {
  return (
    <Section title="Quotas & tiers">
      <div className="divide-y divide-panel-border">
        {TIERS.map((t) => (
          <div key={t.tier} className="flex items-center gap-4 py-2.5">
            <span className="w-16 text-[13px] font-medium text-zinc-100">
              {t.tier}
            </span>
            <span className="flex-1 text-[12px] text-muted">{t.note}</span>
            <span className="font-mono text-[12px] tabular-nums text-zinc-300">
              {t.quota}/wk
            </span>
          </div>
        ))}
      </div>
    </Section>
  );
}

function SourcesSection() {
  const [enabled, setEnabled] = useState<Record<JobSource, boolean>>({
    indeed: true,
    linkedin: true,
    jsearch: false,
  });
  return (
    <Section title="Sources & import">
      <div className="divide-y divide-panel-border">
        {(Object.keys(JOB_SOURCE_LABEL) as JobSource[]).map((s) => (
          <div key={s} className="flex items-center justify-between py-2.5">
            <span className="text-[13px] text-zinc-200">{JOB_SOURCE_LABEL[s]}</span>
            <button
              onClick={() => setEnabled((e) => ({ ...e, [s]: !e[s] }))}
              className={
                "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors " +
                (enabled[s]
                  ? "bg-status-offer/15 text-status-offer"
                  : "bg-zinc-800 text-zinc-500")
              }
            >
              {enabled[s] ? "Enabled" : "Disabled"}
            </button>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[11.5px] text-muted">
        CSV import templates (column mappings) for bulk import are configured here
        — coming soon.
      </p>
    </Section>
  );
}

function AuditSection({ audit }: { audit: AuditEntry[] }) {
  return (
    <Section title="Audit log">
      <div className="divide-y divide-panel-border">
        {audit.map((a) => (
          <div key={a.id} className="flex items-baseline gap-3 py-2">
            <span className="w-28 shrink-0 font-mono text-[11px] tabular-nums text-zinc-500">
              {a.at}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] text-zinc-200">
                <span className="font-medium">{a.actor}</span>{" "}
                <span className="text-muted">{a.action}</span>
              </p>
              <p className="truncate text-[11px] text-zinc-500">{a.entity}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Panel className="p-5">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-[13px] font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </Panel>
  );
}
