"use client";

// Review — the client's core action, built to handle a big queue (10+) without
// fatigue: one focused card at a time, a progress meter, a compact "up next"
// list to jump around, and undo for the last decision. Accepting sends the job
// to the team (it lands in their Approved column to take forward); declining
// requires a reason, framed constructively — it steers the next sourcing round.

import { useState } from "react";
import Link from "next/link";
import { useClientPortal } from "@/components/client/client-portal-context";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/ui/match-score";
import { Panel } from "@/components/ui/panel";
import {
  REJECT_CATEGORY_LABEL,
  type ApplicationJob,
  type RejectCategory,
} from "@/lib/api";

const CATEGORIES = Object.keys(REJECT_CATEGORY_LABEL) as RejectCategory[];

interface DoneEntry {
  id: string;
  title: string;
  company: string;
  action: "accepted" | "declined";
}

export default function ClientReviewPage() {
  const { client } = useClientPortal();

  if (!client.approvalRequired) {
    return (
      <Empty
        title="No review needed"
        body="You've asked us to apply on your behalf, so we don't send jobs for approval. Follow every application under My Jobs."
      />
    );
  }

  return <ReviewQueue />;
}

function ReviewQueue() {
  const { reviewQueue, approve, reject, undo } = useClientPortal();
  const [done, setDone] = useState<DoneEntry[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const current =
    reviewQueue.find((j) => j.id === currentId) ?? reviewQueue[0] ?? null;
  const upNext = reviewQueue.filter((j) => j.id !== current?.id);
  const total = reviewQueue.length + done.length;
  const last = done[done.length - 1];

  function record(job: ApplicationJob, action: DoneEntry["action"]) {
    setDone((d) => [
      ...d,
      { id: job.id, title: job.title, company: job.company, action },
    ]);
    setCurrentId(null); // advance to the next job in the queue
  }

  function handleUndo() {
    if (!last) return;
    undo(last.id);
    setDone((d) => d.slice(0, -1));
    setCurrentId(last.id);
  }

  if (total === 0) {
    return (
      <Empty
        title="All caught up 🎉"
        body="You’ve reviewed everything we’ve found so far. We’ll email you when new jobs are ready."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-8 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">
            Review your jobs
          </h1>
          <p className="mt-1 max-w-xl text-[14px] text-muted">
            Accept the ones you’d like us to apply to. If one isn’t right, tell
            us why so we can find better matches.
          </p>
        </div>
        <ProgressMeter reviewed={done.length} total={total} />
      </header>

      {/* Undo the last decision */}
      {last && (
        <div className="flex items-center justify-between gap-3 rounded-md border border-panel-border px-3.5 py-2">
          <p className="min-w-0 truncate text-[12.5px] text-muted">
            {last.action === "accepted" ? "Accepted" : "Declined"}{" "}
            <span className="font-medium text-foreground">
              {last.title} · {last.company}
            </span>
          </p>
          <button
            onClick={handleUndo}
            className="shrink-0 text-[12px] font-semibold text-[var(--accent-strong)] hover:underline"
          >
            Undo
          </button>
        </div>
      )}

      {current ? (
        <FocusCard
          key={current.id}
          job={current}
          remaining={reviewQueue.length}
          onAccept={() => {
            approve(current.id);
            record(current, "accepted");
          }}
          onDecline={(category, detail) => {
            reject(current.id, category, detail);
            record(current, "declined");
          }}
        />
      ) : (
        <Panel className="p-6 text-center">
          <h2 className="text-[16px] font-semibold">
            Nice work — that’s all {done.length} reviewed 🎉
          </h2>
          <p className="mx-auto mt-1 max-w-md text-[13.5px] text-muted">
            We’ll start on the ones you accepted right away. Follow them under
            My Jobs.
          </p>
          <Link href="/client/jobs" className="mt-4 inline-block">
            <Button variant="primary" size="md">
              Go to My Jobs
            </Button>
          </Link>
        </Panel>
      )}

      {/* Up next — jump anywhere in the queue */}
      {upNext.length > 0 && (
        <section>
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
            Up next · {upNext.length}
          </h2>
          <Panel className="divide-y divide-panel-border overflow-hidden">
            {upNext.map((job) => (
              <button
                key={job.id}
                onClick={() => setCurrentId(job.id)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--panel-border)_35%,transparent)]"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{job.title}</p>
                  <p className="truncate text-[12px] text-muted">
                    {job.company} · {job.location}
                  </p>
                </div>
                <MatchScore score={job.matchScore} className="shrink-0" />
              </button>
            ))}
          </Panel>
        </section>
      )}
    </div>
  );
}

function ProgressMeter({ reviewed, total }: { reviewed: number; total: number }) {
  const pct = total > 0 ? (reviewed / total) * 100 : 0;
  return (
    <div className="min-w-[160px]">
      <p className="text-right font-mono text-[12px] tabular-nums text-muted">
        {reviewed}/{total} reviewed
      </p>
      <div
        className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--panel-border)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, backgroundColor: "var(--accent)" }}
        />
      </div>
    </div>
  );
}

function FocusCard({
  job,
  remaining,
  onAccept,
  onDecline,
}: {
  job: ApplicationJob;
  remaining: number;
  onAccept: () => void;
  onDecline: (category: RejectCategory, detail: string) => void;
}) {
  const [declining, setDeclining] = useState(false);
  const [category, setCategory] = useState<RejectCategory | null>(null);
  const [detail, setDetail] = useState("");

  return (
    <Panel className="p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[17px] font-semibold leading-snug">{job.title}</h2>
          <p className="mt-1 text-[13.5px] text-muted">
            {job.company} · {job.location}
          </p>
        </div>
        {job.matchScore !== undefined && <MatchScore score={job.matchScore} />}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {job.salary && <FactChip>{job.salary}</FactChip>}
        {job.postedAt && <FactChip>Posted {job.postedAt}</FactChip>}
      </div>

      {!declining ? (
        <div className="mt-5 flex items-center gap-2">
          <Button variant="primary" size="md" onClick={onAccept}>
            Accept — apply for me
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={() => setDeclining(true)}
          >
            Not a fit
          </Button>
          <span className="ml-auto text-[11.5px] text-muted">
            {remaining - 1 > 0
              ? `${remaining - 1} more after this`
              : "last one"}
          </span>
        </div>
      ) : (
        <div className="mt-5 space-y-3 rounded-md border border-panel-border p-4">
          <p className="text-[13px] font-medium">
            Why isn’t this one right?{" "}
            <span className="font-normal text-muted">
              Your reason helps us find better matches.
            </span>
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={
                  "rounded-full border px-3 py-1 text-[12px] transition-colors " +
                  (category === c
                    ? "border-status-rejected bg-status-rejected/10 text-status-rejected"
                    : "border-panel-border text-muted hover:border-zinc-400")
                }
              >
                {REJECT_CATEGORY_LABEL[c]}
              </button>
            ))}
          </div>
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            rows={2}
            placeholder="Add any detail (optional)…"
            className="w-full resize-none rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none placeholder:text-zinc-400 focus:border-zinc-500"
          />
          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              disabled={!category}
              onClick={() => category && onDecline(category, detail.trim())}
            >
              Submit
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setDeclining(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function FactChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-panel-border px-2.5 py-0.5 text-[11.5px] text-muted">
      {children}
    </span>
  );
}

function Empty({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-3xl space-y-5 px-8 py-8">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight">Review</h1>
      </header>
      <Panel className="p-6 text-center">
        <h2 className="text-[16px] font-semibold">{title}</h2>
        <p className="mx-auto mt-1 max-w-md text-[13.5px] text-muted">{body}</p>
        <Link href="/client/jobs" className="mt-4 inline-block">
          <Button variant="secondary" size="md">
            Go to My Jobs
          </Button>
        </Link>
      </Panel>
    </div>
  );
}
