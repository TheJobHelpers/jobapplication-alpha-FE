"use client";

// Admin — staff, quotas/tiers, sources & import templates, and the audit log.
// Admins see everything; managers get the quotas slice only (09 Pages §Admin).
// Quota edits, source toggles, and UI actions persist in the localStorage
// store until the backend; the audit log merges those actions with the
// fixture trail.

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
  type QuotaTier,
  type TeamMember,
} from "@/lib/api";
import { isAdmin, isManagerPlus } from "@/lib/permissions";

export function SettingsView({
  team,
  audit,
  tiers,
}: {
  team: TeamMember[];
  audit: AuditEntry[];
  tiers: QuotaTier[];
}) {
  const { user } = useCurrentUser();
  const { audit: uiAudit } = useStore();
  if (!isManagerPlus(user)) return <AccessDenied need="managers and admins" />;
  const admin = isAdmin(user);

  return (
    <div className="mx-auto max-w-4xl px-8 py-8">
      <header className="mb-6">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Admin
        </p>
        <h1 className="mt-1 text-[16px] font-semibold">
          {admin ? "Settings & audit" : "Quotas & tiers"}
        </h1>
        {!admin && (
          <p className="mt-1 text-[12.5px] text-muted">
            Managers can adjust weekly quotas. Staff, sources, and the audit log
            are admin-only.
          </p>
        )}
      </header>

      <div className="space-y-6">
        {admin && <StaffSection team={team} />}
        <QuotaSection tiers={tiers} />
        {admin && <SourcesSection />}
        {admin && <AuditSection audit={[...uiAudit, ...audit]} />}
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
  const { members: created, addMember, logAudit } = useStore();
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
              logAudit(user.name, "Invited member", m.name);
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

// Default weekly quotas per tier; edits persist in the store and are audited.
function QuotaSection({ tiers }: { tiers: QuotaTier[] }) {
  const { user } = useCurrentUser();
  const { tierQuotas, setTierQuota, logAudit } = useStore();

  return (
    <Section title="Quotas & tiers">
      <div className="divide-y divide-panel-border">
        {tiers.map((t) => {
          const quota = tierQuotas[t.tier] ?? t.quota;
          return (
            <div key={t.tier} className="flex items-center gap-4 py-2.5">
              <span className="w-16 text-[13px] font-medium text-zinc-100">
                {t.tier}
              </span>
              <span className="flex-1 text-[12px] text-muted">{t.note}</span>
              <input
                type="number"
                min={1}
                max={40}
                value={quota}
                aria-label={`${t.tier} weekly quota`}
                onChange={(e) => {
                  const n = Number(e.target.value);
                  if (!Number.isFinite(n) || n < 1) return;
                  setTierQuota(t.tier, n);
                }}
                onBlur={() => {
                  // Audit once per edit, not per keystroke.
                  if (quota !== t.quota)
                    logAudit(
                      user.name,
                      `Set ${t.tier} default quota to ${quota}/wk`,
                      "Quota tiers",
                    );
                }}
                className="h-7 w-16 rounded-md border border-panel-border bg-panel px-2 text-right font-mono text-[12px] tabular-nums text-zinc-200 outline-none focus:border-zinc-600"
              />
              <span className="text-[11px] text-muted">/wk</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-[11.5px] text-muted">
        Defaults for new clients — per-client overrides live on the client
        record.
      </p>
    </Section>
  );
}

function SourcesSection() {
  const { user } = useCurrentUser();
  const { sourcesEnabled, setSourceEnabled, logAudit } = useStore();
  const DEFAULTS: Record<JobSource, boolean> = {
    indeed: true,
    linkedin: true,
    jsearch: false,
  };
  return (
    <Section title="Sources & import">
      <div className="divide-y divide-panel-border">
        {(Object.keys(JOB_SOURCE_LABEL) as JobSource[]).map((s) => {
          const on = sourcesEnabled[s] ?? DEFAULTS[s];
          return (
            <div key={s} className="flex items-center justify-between py-2.5">
              <span className="text-[13px] text-zinc-200">
                {JOB_SOURCE_LABEL[s]}
              </span>
              <button
                onClick={() => {
                  setSourceEnabled(s, !on);
                  logAudit(
                    user.name,
                    `${on ? "Disabled" : "Enabled"} source ${JOB_SOURCE_LABEL[s]}`,
                    "Sources",
                  );
                }}
                className={
                  "rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-colors " +
                  (on
                    ? "bg-status-offer/15 text-status-offer"
                    : "bg-zinc-800 text-zinc-500")
                }
              >
                {on ? "Enabled" : "Disabled"}
              </button>
            </div>
          );
        })}
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
