"use client";

// Client Dashboard — leads with the one thing the client should do next. If jobs
// are waiting, that's front and center; otherwise it reassures them work is
// happening. Progress tiles show momentum without jargon.

import Link from "next/link";
import { useClientPortal } from "@/components/client/client-portal-context";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import type { JobStatus } from "@/lib/api";

const IN_PROGRESS: Set<JobStatus> = new Set([
  "approved",
  "in_progress",
  "assigned",
  "applying",
  "applied",
]);

export default function ClientDashboard() {
  const { client, jobs, reviewQueue } = useClientPortal();
  const firstName = client.name.split(" ")[0];

  const blocked = jobs.filter((j) => j.status === "blocked");
  const inProgress = jobs.filter((j) => IN_PROGRESS.has(j.status)).length;
  const interviewing = jobs.filter((j) => j.status === "interviewing").length;
  const offers = jobs.filter((j) => j.status === "offer").length;

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-8 py-8">
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
            Approve the ones you’d like us to apply to. If one isn’t right, tell us
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

      {/* Progress */}
      <div>
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Your progress
        </p>
        <div className="grid grid-cols-3 gap-3">
          <Stat label="In progress" value={inProgress} />
          <Stat label="Interviewing" value={interviewing} tone="var(--status-interview)" />
          <Stat label="Offers" value={offers} tone="var(--status-offer)" />
        </div>
      </div>

      <p className="text-[12px] text-muted">
        Questions about your search?{" "}
        <span className="font-medium text-foreground">{client.ownerName}</span> is
        your dedicated Job Helper.
      </p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: string;
}) {
  return (
    <Panel className="p-4">
      <p
        className="font-mono text-[26px] leading-none tabular-nums"
        style={tone ? { color: tone } : undefined}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] text-muted">{label}</p>
    </Panel>
  );
}
