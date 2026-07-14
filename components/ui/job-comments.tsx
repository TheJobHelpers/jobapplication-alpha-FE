"use client";

// Comment thread on a job card — the team↔client channel (pipeline/workspace on
// the internal side, My Jobs on the client side). Backend-backed: the seed loads
// from the API and new comments POST to it (the client posts via /me/*, the team
// via /jobs/*), then mirror into the shared overlay so the thread updates
// instantly. Uses portal tokens only, so it renders in both portals and themes.

import { useEffect, useState } from "react";
import { useStore } from "@/components/shell/store-context";
import { api, type CommentSide, type JobComment } from "@/lib/api";

export function JobComments({
  jobId,
  author,
  side,
}: {
  jobId: string;
  author: string; // signed-in name (used for the client-side optimistic stamp)
  side: CommentSide; // "client" → post/read via /me/*, "team" → staff endpoints
}) {
  const { commentsByJobId, addComment } = useStore();
  const [seed, setSeed] = useState<JobComment[]>([]);
  const [text, setText] = useState("");

  useEffect(() => {
    const load =
      side === "client" ? api.me.getJobComments(jobId) : api.getJobComments(jobId);
    load.then(setSeed).catch(() => setSeed([]));
  }, [jobId, side]);

  const comments = [...seed, ...(commentsByJobId[jobId] ?? [])];

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    // Optimistic add now; persist in the background (client posts via /me/*).
    addComment({
      id: `cm_${jobId}_${Date.now()}`,
      jobId,
      author,
      side,
      text: trimmed,
      at: new Date().toISOString().slice(0, 10),
    });
    setText("");
    const post =
      side === "client"
        ? api.me.addJobComment(jobId, trimmed)
        : api.addJobComment(jobId, trimmed);
    post.catch((e) => console.error("comment failed:", e));
  }

  return (
    <div className="space-y-2.5">
      {comments.length === 0 ? (
        <p className="text-[11.5px] text-muted">
          No comments yet — anything the {side === "team" ? "client" : "team"}{" "}
          should know lands here.
        </p>
      ) : (
        comments.map((c) => (
          <div key={c.id} className="text-[11.5px] leading-snug">
            <p className="flex items-baseline gap-1.5">
              <span className="font-semibold text-foreground">{c.author}</span>
              <SidePill side={c.side} />
              <span className="font-mono text-[10px] tabular-nums text-muted">
                {c.at}
              </span>
            </p>
            <p className="mt-0.5 text-muted">{c.text}</p>
          </div>
        ))
      )}
      <div className="flex items-center gap-1.5">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Write a comment…"
          aria-label="Write a comment"
          className="h-7 min-w-0 flex-1 rounded-md border border-panel-border bg-transparent px-2 text-[11.5px] text-foreground outline-none placeholder:text-muted focus:border-[var(--accent)]"
        />
        <button
          onClick={send}
          disabled={!text.trim()}
          className="h-7 rounded-md bg-[var(--accent)] px-2 text-[11px] font-semibold text-white transition-opacity disabled:opacity-40"
        >
          Send
        </button>
      </div>
    </div>
  );
}

// Small read-only badge for cards — the thread itself lives in the detail
// popup. Hidden when the thread is empty. `portal` picks the read endpoint
// (client cards read via /me/*).
export function CommentCount({
  jobId,
  portal = "internal",
}: {
  jobId: string;
  portal?: "internal" | "client";
}) {
  const { commentsByJobId } = useStore();
  const [seedCount, setSeedCount] = useState(0);
  useEffect(() => {
    const load =
      portal === "client" ? api.me.getJobComments(jobId) : api.getJobComments(jobId);
    load.then((c) => setSeedCount(c.length)).catch(() => setSeedCount(0));
  }, [jobId, portal]);
  const n = seedCount + (commentsByJobId[jobId]?.length ?? 0);
  if (n === 0) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] text-muted">
      <CommentIcon />
      <span className="font-mono tabular-nums">{n}</span>
    </span>
  );
}

function SidePill({ side }: { side: CommentSide }) {
  return (
    <span className="rounded-full bg-[color-mix(in_srgb,var(--accent)_15%,transparent)] px-1.5 py-px text-[9px] font-semibold uppercase tracking-wide text-[var(--accent)]">
      {side === "team" ? "Team" : "Client"}
    </span>
  );
}

function CommentIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}
