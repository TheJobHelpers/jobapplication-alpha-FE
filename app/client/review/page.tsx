"use client";

// Review — the client's core action. Two modes, one page:
//  • Jobs waiting → a single focused card (accept / decline-with-reason), a
//    progress meter, "up next" to jump around, and undo — kept deliberately
//    focused so a big queue doesn't fatigue.
//  • Caught up → instead of a bare empty state, we surface the client's review
//    **history** (what they've accepted / declined and where it went), so the
//    page stays useful and they can see the record of their decisions.
// Accepting sends the job to the team (their Approved column); declining needs a
// reason, framed constructively — it steers the next sourcing round.

import { useState } from "react";
import Link from "next/link";
import { useClientPortal } from "@/components/client/client-portal-context";
import { Button } from "@/components/ui/button";
import { MatchScore } from "@/components/ui/match-score";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/cn";
import { relativeDate } from "@/lib/format";
import {
  REJECT_CATEGORY_LABEL,
  STATUS_META,
  type ApplicationJob,
  type JobStatus,
  type RejectCategory,
} from "@/lib/api";

const CATEGORIES = Object.keys(REJECT_CATEGORY_LABEL) as RejectCategory[];

// Jobs the client has already decided on (accepted → approved+, declined →
// rejected). client_review is still pending; sourced hasn't reached them yet.
const HISTORY_EXCLUDE: Set<JobStatus> = new Set(["client_review", "sourced"]);

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
  const { jobs, reviewQueue, approve, reject, undo } = useClientPortal();
  const [done, setDone] = useState<DoneEntry[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);

  const current =
    reviewQueue.find((j) => j.id === currentId) ?? reviewQueue[0] ?? null;
  const upNext = reviewQueue.filter((j) => j.id !== current?.id);
  const total = reviewQueue.length + done.length;
  const last = done[done.length - 1];
  const hasQueue = reviewQueue.length > 0;

  const history = jobs
    .filter((j) => !HISTORY_EXCLUDE.has(j.status))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

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

  return (
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight">
            Review your jobs
          </h1>
          <p className="mt-1 max-w-xl text-[14px] text-muted">
            {hasQueue
              ? "Accept the ones you’d like us to apply to. If one isn’t right, tell us why so we can find better matches."
              : "You’re all caught up. Here’s the record of what you’ve reviewed."}
          </p>
        </div>
        {hasQueue && <ProgressMeter reviewed={done.length} total={total} />}
      </header>

      {hasQueue ? (
        // ── Focus mode: card on the left, queue + history alongside ──
        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
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

            {current && (
              <ReviewDeck
                current={current}
                upNext={upNext}
                remaining={reviewQueue.length}
                onJump={setCurrentId}
                onAccept={() => {
                  approve(current.id);
                  record(current, "accepted");
                }}
                onDecline={(category, detail) => {
                  reject(current.id, category, detail);
                  record(current, "declined");
                }}
              />
            )}
          </div>

          <aside className="space-y-6">
            {history.length > 0 && (
              <section>
                <SectionLabel>Reviewed · {history.length}</SectionLabel>
                <HistoryPanel history={history} />
              </section>
            )}
          </aside>
        </div>
      ) : (
        // ── Caught-up mode: hero + full-width history ──
        <div className="mt-6 space-y-6">
          <CaughtUpHero reviewed={done.length} />
          {history.length > 0 && (
            <section>
              <SectionLabel>Your review history · {history.length}</SectionLabel>
              <HistoryPanel history={history} />
            </section>
          )}
        </div>
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

function CaughtUpHero({ reviewed }: { reviewed: number }) {
  return (
    <Panel
      className="flex flex-col items-center p-8 text-center"
      style={{
        borderColor: "var(--accent)",
        backgroundColor: "color-mix(in srgb, var(--accent) 6%, var(--panel))",
      }}
    >
      <span
        className="flex h-12 w-12 items-center justify-center rounded-full"
        style={{
          backgroundColor: "color-mix(in srgb, var(--accent) 18%, transparent)",
          color: "var(--accent-strong)",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <h2 className="mt-3 text-[17px] font-semibold">
        {reviewed > 0
          ? `Nice work — that’s all ${reviewed} reviewed 🎉`
          : "You’re all caught up 🎉"}
      </h2>
      <p className="mx-auto mt-1 max-w-md text-[13.5px] text-muted">
        {reviewed > 0
          ? "We’ll start on the ones you accepted right away. Follow them under My Jobs."
          : "You’ve reviewed everything we’ve found so far. We’ll email you when new jobs are ready."}
      </p>
      <Link href="/client/jobs" className="mt-4 inline-block">
        <Button variant="primary" size="md">
          Go to My Jobs
        </Button>
      </Link>
    </Panel>
  );
}

// A row per decided job: the decision, the role, where it is now, and when.
function HistoryPanel({ history }: { history: ApplicationJob[] }) {
  return (
    <Panel className="divide-y divide-panel-border overflow-hidden">
      {history.map((j) => {
        const declined = j.status === "rejected";
        const detail = declined
          ? j.rejectCategory
            ? REJECT_CATEGORY_LABEL[j.rejectCategory]
            : "Not a fit"
          : STATUS_META[j.status].clientLabel;
        return (
          <div key={j.id} className="flex items-center gap-3 px-4 py-2.5">
            <span
              className={
                "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
                (declined
                  ? "bg-status-rejected/15 text-status-rejected"
                  : "bg-status-offer/15 text-status-offer")
              }
            >
              {declined ? "Not a fit" : "Accepted"}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13px] font-medium">{j.title}</p>
              <p className="truncate text-[12px] text-muted">
                {j.company} · {detail}
              </p>
            </div>
            <span className="shrink-0 text-[11px] text-muted">
              {relativeDate(j.updatedAt)}
            </span>
          </div>
        );
      })}
    </Panel>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
      {children}
    </h2>
  );
}

// Vertical step between stacked cards. A module const so PeekCard's clickable
// strip is exactly as tall as the reveal.
const DECK_GAP = 52;

// The queue as a stack: the active card sits on top, and ALL remaining jobs
// cascade below it in queue order — same width, each a full clickable row (click
// to jump to it) — while the decided card flies away and the next rises up.
function ReviewDeck({
  current,
  upNext,
  remaining,
  onJump,
  onAccept,
  onDecline,
}: {
  current: ApplicationJob;
  upNext: ApplicationJob[];
  remaining: number;
  onJump: (id: string) => void;
  onAccept: () => void;
  onDecline: (category: RejectCategory, detail: string) => void;
}) {
  const [exiting, setExiting] = useState<{
    job: ApplicationJob;
    dir: "accept" | "decline";
  } | null>(null);

  const bottomPad = upNext.length ? DECK_GAP * upNext.length + 20 : 0;

  function decide(dir: "accept" | "decline", run: () => void) {
    setExiting({ job: current, dir });
    run(); // advance the queue underneath; the old card flies off on top
    // Clear via a timer (not just onAnimationEnd) so the overlay always lifts —
    // e.g. under prefers-reduced-motion the animation is disabled and no
    // animationend event fires.
    window.setTimeout(() => setExiting(null), 340);
  }

  return (
    <div className="relative" style={{ marginBottom: bottomPad }}>
      {/* Every remaining job cascades below — each wrapper matches the active
          card's box (inset top-0 bottom-0), then slides down one DECK_GAP per
          position so it shows a full-width, readable, clickable row. Kept at the
          same width (no scaling); only opacity recedes. */}
      {upNext.map((job, i) => (
        <div
          key={job.id}
          className="absolute inset-x-0 bottom-0 top-0"
          style={{
            transform: `translateY(${DECK_GAP * (i + 1)}px)`,
            opacity: Math.max(0.5, 1 - i * 0.07),
            zIndex: 12 - i,
            transition: "transform 300ms ease, opacity 300ms ease",
          }}
        >
          <PeekCard job={job} onJump={() => onJump(job.id)} />
        </div>
      ))}

      {/* Active, interactive card — re-keyed so each new top card animates in */}
      <div key={current.id} className="deck-in relative z-20">
        <FocusCard
          job={current}
          remaining={remaining}
          onAccept={() => decide("accept", onAccept)}
          onDecline={(category, detail) =>
            decide("decline", () => onDecline(category, detail))
          }
        />
      </div>

      {/* The just-decided card flying away, revealing the new top card beneath */}
      {exiting && (
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-30",
            exiting.dir === "accept" ? "deck-out-accept" : "deck-out-decline",
          )}
          onAnimationEnd={() => setExiting(null)}
        >
          <ExitingCard job={exiting.job} accepted={exiting.dir === "accept"} />
        </div>
      )}
    </div>
  );
}

// A card in the stack. It fills the active card's box, but only its bottom strip
// (one DECK_GAP tall) shows below the card above it — that strip is a button:
// click to jump this job to the top for review.
function PeekCard({ job, onJump }: { job: ApplicationJob; onJump: () => void }) {
  return (
    <Panel className="relative h-full">
      <button
        onClick={onJump}
        style={{ height: DECK_GAP }}
        className="group absolute inset-x-0 bottom-0 flex items-center gap-2.5 rounded-b-lg px-5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--panel-border)_35%,transparent)]"
      >
        <MatchScore score={job.matchScore} className="shrink-0" />
        <span className="min-w-0 truncate text-[12.5px]">
          <span className="font-medium">{job.title}</span>
          <span className="text-muted"> · {job.company}</span>
        </span>
        <span className="ml-auto shrink-0 text-[11px] font-medium text-[var(--accent-strong)] opacity-0 transition-opacity group-hover:opacity-100">
          Jump →
        </span>
      </button>
    </Panel>
  );
}

// The card mid-flight, badged with the decision as it leaves.
function ExitingCard({ job, accepted }: { job: ApplicationJob; accepted: boolean }) {
  return (
    <Panel
      className="p-6"
      style={{ borderColor: accepted ? "var(--accent)" : "var(--status-rejected)" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="truncate text-[16px] font-semibold leading-snug">
            {job.title}
          </h3>
          <p className="mt-1 truncate text-[13px] text-muted">
            {job.company} · {job.location}
          </p>
        </div>
        <span
          className={
            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
            (accepted
              ? "bg-status-offer/15 text-status-offer"
              : "bg-status-rejected/15 text-status-rejected")
          }
        >
          {accepted ? "Accepted" : "Not a fit"}
        </span>
      </div>
      {job.salary && (
        <div className="mt-3">
          <FactChip>{job.salary}</FactChip>
        </div>
      )}
    </Panel>
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
    <Panel className="p-6" style={{ borderColor: "var(--accent)" }}>
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
            {remaining - 1 > 0 ? `${remaining - 1} more after this` : "last one"}
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
    <div className="mx-auto max-w-5xl px-8 py-8">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight">Review</h1>
      </header>
      <Panel className="mt-6 p-8 text-center">
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
