"use client";

// Questionnaire (CQFO) tracking — the onboarding milestone as its own status.
// Staff send the public link, copy it, and track whether the client completed
// it. Self-contained: reads/writes the store, gated to editors of the client.

import { useState } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore } from "@/components/shell/store-context";
import { Button } from "@/components/ui/button";
import {
  QUESTIONNAIRE_LABEL,
  type Client,
  type QuestionnaireState,
  type QuestionnaireStatus,
} from "@/lib/api";
import { canEditClient } from "@/lib/permissions";

export function effectiveQuestionnaire(
  client: Client,
  map: Record<string, QuestionnaireState>,
): QuestionnaireState {
  return map[client.id] ?? client.questionnaire ?? { status: "not_sent" };
}

export function qColor(status: QuestionnaireStatus): string {
  return status === "completed"
    ? "var(--status-offer)"
    : status === "in_progress"
      ? "var(--status-interview)"
      : status === "sent"
        ? "var(--status-assigned)"
        : "var(--status-expired)";
}

export function genToken(clientId: string): string {
  return `tok_${clientId.slice(-6)}_${Date.now().toString(36)}`;
}

// Build the public questionnaire URL against the app's real origin — the
// deployed site in prod (NEXT_PUBLIC_APP_URL, e.g. the Vercel/custom domain) or
// whatever origin the staff are on (localhost in dev). The old hardcoded
// app.ja-alpha.com domain didn't exist, so the link couldn't be opened.
export function qUrl(token?: string): string {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ??
    (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}/q/${token ?? ""}`;
}

export function QuestionnaireStatusChip({ status }: { status: QuestionnaireStatus }) {
  const color = qColor(status);
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 18%, transparent)` }}
    >
      {QUESTIONNAIRE_LABEL[status]}
    </span>
  );
}

export function QuestionnairePanel({ client }: { client: Client }) {
  const { user } = useCurrentUser();
  const { questionnaireById, sendQuestionnaire, setQuestionnaireStatus } = useStore();
  const q = effectiveQuestionnaire(client, questionnaireById);
  const canManage = canEditClient(user, client.ownerId);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(qUrl(q.token)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
          Onboarding questionnaire
        </p>
        <QuestionnaireStatusChip status={q.status} />
      </div>

      {q.status === "not_sent" ? (
        <div className="mt-3">
          <p className="text-[12px] text-muted">
            Not sent yet. Email {client.name.split(" ")[0]} the CQFO link, or enter
            answers manually.
          </p>
          {canManage && (
            <Button
              variant="primary"
              size="sm"
              className="mt-2"
              onClick={() => sendQuestionnaire(client.id)}
            >
              Send questionnaire
            </Button>
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Link + copy */}
          <div className="flex items-center gap-2 rounded-md border border-panel-border p-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[11.5px] text-[var(--accent)]">
              {qUrl(q.token)}
            </span>
            <button
              onClick={copy}
              className="shrink-0 rounded border border-zinc-700 px-2 py-1 text-[11px] font-semibold text-zinc-200 hover:bg-zinc-800/60"
            >
              {copied ? "Copied!" : "Copy link"}
            </button>
          </div>

          {/* Timeline */}
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-[11.5px] text-muted">
            {q.sentAt && (
              <span>
                Sent <span className="text-zinc-300">{q.sentAt}</span>
              </span>
            )}
            {q.completedAt && (
              <span>
                Completed{" "}
                <span className="text-status-offer">{q.completedAt}</span>
              </span>
            )}
          </div>

          {/* Actions */}
          {canManage && q.status !== "completed" && (
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setQuestionnaireStatus(client.id, "completed")}
              >
                Mark completed
              </Button>
              {q.status === "sent" && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setQuestionnaireStatus(client.id, "in_progress")}
                >
                  Mark in progress
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => sendQuestionnaire(client.id)}
              >
                Resend
              </Button>
            </div>
          )}
          {q.status === "completed" && canManage && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setQuestionnaireStatus(client.id, "sent")}
            >
              Reopen
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
