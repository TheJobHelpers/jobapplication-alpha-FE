"use client";

// Review — the client's core action. Each job we sourced can be approved (one tap)
// or declined with a reason. The reason is required and framed constructively: it
// steers the team's next sourcing round (06/08 UX). Declines are never a dead end.

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

export default function ClientReviewPage() {
  const { client, reviewQueue } = useClientPortal();

  if (!client.approvalRequired) {
    return (
      <Empty
        title="No review needed"
        body="You've asked us to apply on your behalf, so we don't send jobs for approval. Follow every application under My Jobs."
      />
    );
  }

  if (reviewQueue.length === 0) {
    return (
      <Empty
        title="All caught up 🎉"
        body="You’ve reviewed everything we’ve found so far. We’ll email you when new jobs are ready."
      />
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 px-8 py-8">
      <header>
        <h1 className="text-[20px] font-semibold tracking-tight">
          Review your jobs
        </h1>
        <p className="mt-1 max-w-xl text-[14px] text-muted">
          These are jobs we found for you. Approve the ones you’d like us to apply
          to. If one isn’t right, tell us why so we can find better matches.
        </p>
      </header>

      <div className="space-y-3">
        {reviewQueue.map((job) => (
          <ReviewCard key={job.id} job={job} />
        ))}
      </div>
    </div>
  );
}

function ReviewCard({ job }: { job: ApplicationJob }) {
  const { approve, reject } = useClientPortal();
  const [declining, setDeclining] = useState(false);
  const [category, setCategory] = useState<RejectCategory | null>(null);
  const [detail, setDetail] = useState("");

  return (
    <Panel className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold">{job.title}</h2>
          <p className="mt-0.5 text-[13px] text-muted">
            {job.company} · {job.location}
            {job.salary ? ` · ${job.salary}` : ""}
          </p>
        </div>
        {job.matchScore !== undefined && <MatchScore score={job.matchScore} />}
      </div>

      {!declining ? (
        <div className="mt-4 flex items-center gap-2">
          <Button variant="primary" size="md" onClick={() => approve(job.id)}>
            Approve
          </Button>
          <Button
            variant="destructive"
            size="md"
            onClick={() => setDeclining(true)}
          >
            Not a fit
          </Button>
        </div>
      ) : (
        <div className="mt-4 space-y-3 rounded-md border border-panel-border p-4">
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
              onClick={() => category && reject(job.id, category, detail.trim())}
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
