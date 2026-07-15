"use client";

// Client Dashboard — leads with the one thing to do next (review), then gives a
// calm, transparent read on the whole search: where every role sits (journey),
// what's actually happening (recent updates), this week's delivery, and what
// we're targeting. All numbers are derived in lib/client-insights.ts from the
// client's own jobs, so nothing here is hand-authored or can drift from My Jobs.

import Link from "next/link";
import { useClientPortal } from "@/components/client/client-portal-context";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { StatusChip } from "@/components/ui/status-chip";
import {
  computeClientInsights,
  type ClientInsights,
} from "@/lib/client-insights";
import { relativeDate, formatSalaryRange } from "@/lib/format";
import type { ApplicationJob, ClientPreferences, WorkType } from "@/lib/api";

const WORK_TYPE_LABEL: Record<WorkType, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "On-site",
  any: "Flexible location",
};

export default function ClientDashboard() {
  const { client, jobs, reviewQueue } = useClientPortal();
  const firstName = client.name.split(" ")[0];
  const insights = computeClientInsights(client, jobs);
  const blocked = jobs.filter((j) => j.status === "blocked");

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-8 py-8">
      <header>
        <h1 className="text-[22px] font-semibold tracking-tight">
          Welcome back, {firstName}
        </h1>
        <p className="mt-1 text-[14px] text-muted">
          Here’s where things stand with your job search.
        </p>
      </header>

      {/* Primary call to action */}
      {reviewQueue.length > 0 ? (
        <Panel
          className="p-5"
          style={{
            borderColor: "var(--accent)",
            backgroundColor: "color-mix(in srgb, var(--accent) 7%, var(--panel))",
          }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-strong)]">
            Your turn
          </p>
          <h2 className="mt-1.5 text-[17px] font-semibold">
            {reviewQueue.length} {reviewQueue.length === 1 ? "job is" : "jobs are"}{" "}
            waiting for your review
          </h2>
          <p className="mt-1 max-w-lg text-[13.5px] text-muted">
            Accept the ones you’d like us to apply to. If one isn’t right, tell us
            why. It helps us find better matches next time.
          </p>
          <Link href="/client/review" className="mt-4 inline-block">
            <Button variant="primary" size="md">
              Review {reviewQueue.length} {reviewQueue.length === 1 ? "job" : "jobs"}
            </Button>
          </Link>
        </Panel>
      ) : client.approvalRequired ? (
        <Panel className="p-5">
          <h2 className="text-[16px] font-semibold">You’re all caught up 🎉</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            No jobs are waiting for your review right now. We’ll email you as soon
            as we’ve found new matches for you to look at.
          </p>
        </Panel>
      ) : (
        <Panel className="p-5">
          <h2 className="text-[16px] font-semibold">
            We’re applying on your behalf
          </h2>
          <p className="mt-1 text-[13.5px] text-muted">
            You’ve asked us to handle applications for you, so there’s nothing to
            review. Follow every application under{" "}
            <Link href="/client/jobs" className="font-medium text-[var(--accent-strong)] hover:underline">
              My Jobs
            </Link>
            .
          </p>
        </Panel>
      )}

      {/* Action needed (blocked) */}
      {blocked.length > 0 && (
        <Panel
          className="flex items-center gap-4 p-4"
          style={{ borderColor: "var(--status-blocked)" }}
        >
          <div className="flex-1">
            <p className="text-[13.5px] font-semibold text-status-blocked">
              {blocked.length} application{blocked.length === 1 ? "" : "s"} need
              {blocked.length === 1 ? "s" : ""} something from you
            </p>
            <p className="mt-0.5 text-[12.5px] text-muted">
              {blocked[0].reason ?? "We need a detail to continue."}
            </p>
          </div>
          <Link href="/client/jobs">
            <Button variant="secondary" size="sm">
              See what’s needed
            </Button>
          </Link>
        </Panel>
      )}

      {/* Headline stats */}
      <StatCards insights={insights} />

      {/* The whole search, at a glance */}
      <Journey insights={insights} />

      {/* This week + recent activity */}
      <div className="grid gap-4 md:grid-cols-2">
        <ThisWeek insights={insights} />
        <RecentUpdates recent={insights.recent} />
      </div>

      {/* What we're looking for */}
      {client.preferences && <SearchFocus prefs={client.preferences} />}

      <p className="text-[12px] text-muted">
        Questions about your search?{" "}
        <span className="font-medium text-foreground">{client.ownerName}</span> is
        your dedicated Job Helper.
      </p>
    </div>
  );
}

// ── Headline stat cards ────────────────────────────────────────────────
function StatCards({ insights }: { insights: ClientInsights }) {
  const { applicationsSent, interviewing, offers, avgMatch } = insights;
  const cards: StatCardProps[] = [
    {
      label: "Applications sent",
      value: applicationsSent,
      color: "var(--status-applied)",
      sub: "roles applied to",
    },
    {
      label: "Interviewing",
      value: interviewing,
      color: "var(--status-interview)",
      sub: interviewing > 0 ? "in play now" : "none yet",
    },
    {
      label: "Offers",
      value: offers,
      color: "var(--status-offer)",
      sub: offers > 0 ? "🎉 live" : "none yet",
    },
    {
      label: "Avg match",
      value: avgMatch === null ? "—" : `${avgMatch}%`,
      color: "rgb(129 140 248)", // indigo — matches the MatchScore meter
      sub: "across active roles",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: number | string;
  color: string;
  sub: string;
}

function StatCard({ label, value, color, sub }: StatCardProps) {
  const dim = value === 0 || value === "—";
  return (
    <Panel className="p-4">
      <div className="flex items-center gap-1.5">
        <span
          aria-hidden
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: dim ? "var(--panel-border)" : color }}
        />
        <p className="text-[11px] text-muted">{label}</p>
      </div>
      <p
        className="mt-2 font-mono text-[28px] leading-none tabular-nums"
        style={dim ? { color: "var(--muted)" } : undefined}
      >
        {value}
      </p>
      <p className="mt-1.5 text-[11px] text-muted">{sub}</p>
    </Panel>
  );
}

// ── Journey: the forward funnel, as a distribution ─────────────────────
function Journey({ insights }: { insights: ClientInsights }) {
  const { stages, activeTotal, notAFit } = insights;

  return (
    <Panel className="p-5">
      <h2 className="text-[13px] font-semibold">Where your search stands</h2>

      {activeTotal === 0 ? (
        <p className="mt-3 text-[13px] text-muted">
          Your search is just getting started — we’ll surface roles here as soon
          as they’re ready for you.
        </p>
      ) : (
        <>
          {/* Proportional bar of roles by stage */}
          <div
            className="mt-4 flex h-2.5 w-full overflow-hidden rounded-full bg-panel-border"
            role="img"
            aria-label="Roles by stage"
          >
            {stages
              .filter((s) => s.count > 0)
              .map((s) => (
                <div
                  key={s.key}
                  style={{ flexGrow: s.count, backgroundColor: s.color }}
                  title={`${s.label}: ${s.count}`}
                />
              ))}
          </div>

          {/* Legend with counts */}
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {stages.map((s) => (
              <div key={s.key} className="flex items-center gap-1.5">
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{
                    backgroundColor: s.count > 0 ? s.color : "var(--panel-border)",
                  }}
                />
                <span className="text-[12px] text-muted">{s.label}</span>
                <span className="font-mono text-[12px] tabular-nums text-foreground">
                  {s.count}
                </span>
              </div>
            ))}
          </div>

          {notAFit > 0 && (
            <p className="mt-3 text-[11.5px] text-muted">
              {notAFit} marked not a fit — we use those to steer future matches.
            </p>
          )}
        </>
      )}
    </Panel>
  );
}

// ── This week's delivery ───────────────────────────────────────────────
function ThisWeek({ insights }: { insights: ClientInsights }) {
  const { used, total, pct, remaining, met } = insights.weekly;
  return (
    <Panel className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold">This week’s applications</h2>
        <span className="font-mono text-[13px] tabular-nums text-muted">
          {used}/{total}
        </span>
      </div>
      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-panel-border">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
        />
      </div>
      <p className="mt-3 text-[12.5px] text-muted">
        {met
          ? "This week’s goal is met — nice momentum. 🎉"
          : used === 0
            ? `We’re aiming for ${total} applications for you this week.`
            : `${remaining} more to reach this week’s goal of ${total}.`}
      </p>
    </Panel>
  );
}

// ── Recent activity feed ───────────────────────────────────────────────
function RecentUpdates({ recent }: { recent: ApplicationJob[] }) {
  return (
    <Panel className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold">Recent updates</h2>
        <Link
          href="/client/jobs"
          className="text-[11.5px] font-medium text-[var(--accent-strong)] hover:underline"
        >
          My Jobs →
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="mt-3 text-[12.5px] text-muted">No activity yet.</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {recent.slice(0, 3).map((j) => (
            <li key={j.id} className="flex items-center gap-3">
              <StatusChip status={j.status} variant="client" />
              <span className="min-w-0 flex-1 truncate text-[12.5px]">
                <span className="font-medium">{j.company}</span>
                <span className="text-muted"> · {j.title}</span>
              </span>
              <span className="shrink-0 text-[11px] text-muted">
                {relativeDate(j.updatedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// ── What we're looking for ─────────────────────────────────────────────
function SearchFocus({ prefs }: { prefs: ClientPreferences }) {
  const meta = [
    WORK_TYPE_LABEL[prefs.workType],
    ...prefs.locations.slice(0, 2),
    formatSalaryRange(prefs.salaryMin, prefs.salaryMax),
  ].filter(Boolean) as string[];

  return (
    <Panel className="p-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold">What we’re looking for</h2>
        <Link
          href="/client/profile"
          className="text-[11.5px] font-medium text-[var(--accent-strong)] hover:underline"
        >
          Refine →
        </Link>
      </div>

      {prefs.titles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {prefs.titles.slice(0, 4).map((t) => (
            <span
              key={t}
              className="rounded-full border border-panel-border px-2.5 py-1 text-[12px]"
            >
              {t}
            </span>
          ))}
        </div>
      )}

      {meta.length > 0 && (
        <p className="mt-3 text-[12.5px] text-muted">{meta.join(" · ")}</p>
      )}
    </Panel>
  );
}

