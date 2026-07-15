"use client";

// Questionnaire (CQFO) tracking — the onboarding milestone as its own status.
// Staff send the public link, copy it, and track whether the client completed
// it. Self-contained: reads/writes the store, gated to editors of the client.

import { useState, useEffect } from "react";
import { useCurrentUser } from "@/components/shell/role-context";
import { useStore, effectiveDocuments } from "@/components/shell/store-context";
import { Button } from "@/components/ui/button";
import {
  QUESTIONNAIRE_LABEL,
  api,
  type Client,
  type ClientDocument,
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
  const {
    questionnaireById,
    documentsById,
    sendQuestionnaire,
    setQuestionnaireStatus,
    upsertDocument,
    logAudit,
  } = useStore();
  const q = effectiveQuestionnaire(client, questionnaireById);
  const [baseDocs, setBaseDocs] = useState<ClientDocument[]>([]);

  useEffect(() => {
    api.getDocuments(client.id)
      .then(setBaseDocs)
      .catch((err) => console.error("Failed to load documents:", err));
  }, [client.id]);

  const docs = effectiveDocuments(baseDocs, documentsById[client.id]);
  const cqfoDoc = docs.find((d) => d.kind === "cqfo");

  const canManage = canEditClient(user, client.ownerId);
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard?.writeText(qUrl(q.token)).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  function handlePdfUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    upsertDocument(client.id, "cqfo", file.name, user.name);
    setQuestionnaireStatus(client.id, "completed");
    logAudit(user.name, `Uploaded questionnaire PDF (${file.name})`, client.name);
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
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            {canManage && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => sendQuestionnaire(client.id)}
              >
                Send questionnaire
              </Button>
            )}
            {canManage && (
              <label className="flex items-center gap-1.5 cursor-pointer rounded-md border border-panel-border px-3 py-1.5 text-[11.5px] font-semibold text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload answers PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {/* Link + copy */}
          {q.status !== "completed" && (
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
          )}

          {/* Uploaded PDF indicator */}
          {cqfoDoc && (
            <div className="flex items-center gap-2 rounded-md border border-status-offer/30 bg-status-offer/5 px-3 py-2 text-[11.5px]">
              <svg className="w-4 h-4 text-status-offer shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-zinc-200 truncate">{cqfoDoc.fileName}</p>
                <p className="text-[10px] text-muted">Uploaded on {cqfoDoc.uploadedAt} by {cqfoDoc.uploadedBy || "staff"}</p>
              </div>
            </div>
          )}

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
            <div className="flex flex-wrap items-center gap-2">
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
              
              <label className="flex items-center gap-1.5 cursor-pointer rounded-md border border-panel-border px-3 py-1.5 text-[11.5px] font-semibold text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Upload answers PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
          {q.status === "completed" && canManage && (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setQuestionnaireStatus(client.id, "sent")}
              >
                Reopen
              </Button>
              
              <label className="flex items-center gap-1.5 cursor-pointer rounded-md border border-panel-border px-3 py-1.5 text-[11.5px] font-semibold text-zinc-300 hover:bg-zinc-800/40 transition-colors">
                <svg className="w-3.5 h-3.5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Replace PDF
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
              </label>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
