"use client";

// Comment thread on a job card — the team↔client channel (pipeline/workspace
// on the internal side, My Jobs on the client side). Fixture seed + store
// additions, oldest first. Collapsed to a count button until opened. Uses
// portal tokens only, so it renders correctly in both portals and themes.

import { useEffect, useState } from "react";
import { useStore } from "@/components/shell/store-context";
import { api, type CommentSide, type JobComment } from "@/lib/api";

export function JobComments({
  jobId,
  author,
  side,
}: {
  jobId: string;
  author: string; // signed-in name to stamp on new comments
  side: CommentSide;
}) {
  const { commentsByJobId, addComment } = useStore();
  const [seed, setSeed] = useState<JobComment[]>([]);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  useEffect(() => {
    api.getJobComments(jobId).then(setSeed);
  }, [jobId]);

  const comments = [...seed, ...(commentsByJobId[jobId] ?? [])];

  function send() {
    const trimmed = text.trim();
    if (!trimmed) return;
    addComment({
      id: `cm_${jobId}_${Date.now()}`,
      jobId,
      author,
      side,
      text: trimmed,
      at: new Date().toISOString().slice(0, 10),
    });
    setText("");
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-[11px] font-medium text-muted transition-colors hover:text-foreground"
      >
        <CommentIcon />
        {comments.length > 0 ? (
          <span className="font-mono tabular-nums">{comments.length}</span>
        ) : (
          <span>Comment</span>
        )}
      </button>

      {open && (
        <div className="mt-2 space-y-2 border-t border-panel-border pt-2">
          {comments.map((c) => (
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
          ))}
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
      )}
    </div>
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
