"use client";

// Mock persistence. No backend yet, so records created in the UI (clients,
// team members) and client stage changes live in localStorage and merge into the
// fixture-backed views. Replaced by real API writes later.

import { createContext, useContext, useEffect, useState } from "react";
import type {
  AuditEntry,
  Client,
  ClientDocument,
  ClientPreferences,
  ClientStage,
  JobComment,
  JobSource,
  JobStatus,
  QuestionnaireState,
  QuestionnaireStatus,
  RejectCategory,
  TeamMember,
} from "@/lib/api";

// Reason/category attached to a status override (client declines carry these
// so the team's views show the why, per DESIGN.md's reasons-always rule).
export interface JobStatusMeta {
  reason?: string;
  rejectCategory?: RejectCategory;
}

const STORAGE_KEY = "ja:store";

interface StoreShape {
  clients: Client[]; // created clients
  members: TeamMember[]; // created team members
  stageById: Record<string, ClientStage>; // stage overrides (created + fixture)
  questionnaireById: Record<string, QuestionnaireState>; // CQFO tracking
  preferencesById: Record<string, ClientPreferences>; // sourcing preference edits
  documentsById: Record<string, ClientDocument[]>; // doc uploads/replacements
  tierQuotas: Record<string, number>; // quota-tier overrides (Admin)
  sourcesEnabled: Partial<Record<JobSource, boolean>>; // org source toggles
  audit: AuditEntry[]; // UI actions, newest first (merged with fixture log)
  jobStatusById: Record<string, JobStatus>; // status overrides (pipeline moves + client decisions) — both portals read these
  jobMetaById: Record<string, JobStatusMeta>; // reason/category riding along an override
  commentsByJobId: Record<string, JobComment[]>; // card threads, oldest first (merged with fixture seed)
}

const EMPTY: StoreShape = {
  clients: [],
  members: [],
  stageById: {},
  questionnaireById: {},
  preferencesById: {},
  documentsById: {},
  tierQuotas: {},
  sourcesEnabled: {},
  audit: [],
  jobStatusById: {},
  jobMetaById: {},
  commentsByJobId: {},
};

interface StoreCtx extends StoreShape {
  addClient: (c: Client) => void;
  addMember: (m: TeamMember) => void;
  setStage: (clientId: string, stage: ClientStage) => void;
  sendQuestionnaire: (clientId: string, token: string) => void;
  setQuestionnaireStatus: (
    clientId: string,
    status: QuestionnaireStatus,
  ) => void;
  setPreferences: (clientId: string, prefs: ClientPreferences) => void;
  upsertDocument: (clientId: string, doc: ClientDocument) => void;
  setTierQuota: (tier: string, quota: number) => void;
  setSourceEnabled: (source: JobSource, enabled: boolean) => void;
  logAudit: (actor: string, action: string, entity: string) => void;
  setJobStatus: (jobId: string, status: JobStatus, meta?: JobStatusMeta) => void;
  clearJobStatus: (jobId: string) => void; // undo a decision — job falls back to its fixture status
  addComment: (comment: JobComment) => void;
}

// Apply a status override (+ its reason meta) to a job shape.
export function applyJobOverride<
  T extends { id: string; status: JobStatus; reason?: string; rejectCategory?: RejectCategory },
>(
  job: T,
  statusById: Record<string, JobStatus>,
  metaById: Record<string, JobStatusMeta>,
): T {
  const status = statusById[job.id];
  if (!status) return job;
  const meta = metaById[job.id];
  return {
    ...job,
    status,
    reason: meta?.reason ?? job.reason,
    rejectCategory: meta?.rejectCategory ?? job.rejectCategory,
  };
}

// Merge a client's fixture documents with store uploads (uploads win per kind).
export function effectiveDocuments(
  base: ClientDocument[],
  overrides: ClientDocument[] | undefined,
): ClientDocument[] {
  if (!overrides || overrides.length === 0) return base;
  const kinds = new Set(overrides.map((d) => d.kind));
  return [...overrides, ...base.filter((d) => !kinds.has(d.kind))];
}

const Ctx = createContext<StoreCtx | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<StoreShape>(EMPTY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setStore({ ...EMPTY, ...JSON.parse(raw) });
    } catch {
      // ignore corrupt storage
    }
  }, []);

  // Functional updates so multiple mutations in one tick compose (e.g. the
  // wizard creates a client AND marks the questionnaire sent).
  function update(fn: (prev: StoreShape) => StoreShape) {
    setStore((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  }

  const today = () => new Date().toISOString().slice(0, 10);

  const value: StoreCtx = {
    ...store,
    addClient: (c) => update((s) => ({ ...s, clients: [c, ...s.clients] })),
    addMember: (m) => update((s) => ({ ...s, members: [m, ...s.members] })),
    setStage: (clientId, stage) =>
      update((s) => ({ ...s, stageById: { ...s.stageById, [clientId]: stage } })),
    sendQuestionnaire: (clientId, token) =>
      update((s) => ({
        ...s,
        questionnaireById: {
          ...s.questionnaireById,
          [clientId]: { status: "sent", token, sentAt: today() },
        },
      })),
    setQuestionnaireStatus: (clientId, status) =>
      update((s) => {
        const prev: QuestionnaireState = s.questionnaireById[clientId] ?? {
          status: "not_sent",
        };
        return {
          ...s,
          questionnaireById: {
            ...s.questionnaireById,
            [clientId]: {
              ...prev,
              status,
              completedAt: status === "completed" ? today() : prev.completedAt,
            },
          },
        };
      }),
    setPreferences: (clientId, prefs) =>
      update((s) => ({
        ...s,
        preferencesById: { ...s.preferencesById, [clientId]: prefs },
      })),
    upsertDocument: (clientId, doc) =>
      update((s) => {
        const existing = s.documentsById[clientId] ?? [];
        return {
          ...s,
          documentsById: {
            ...s.documentsById,
            [clientId]: [doc, ...existing.filter((d) => d.kind !== doc.kind)],
          },
        };
      }),
    setTierQuota: (tier, quota) =>
      update((s) => ({ ...s, tierQuotas: { ...s.tierQuotas, [tier]: quota } })),
    setSourceEnabled: (source, enabled) =>
      update((s) => ({
        ...s,
        sourcesEnabled: { ...s.sourcesEnabled, [source]: enabled },
      })),
    setJobStatus: (jobId, status, meta) =>
      update((s) => ({
        ...s,
        jobStatusById: { ...s.jobStatusById, [jobId]: status },
        jobMetaById: meta
          ? { ...s.jobMetaById, [jobId]: meta }
          : s.jobMetaById,
      })),
    clearJobStatus: (jobId) =>
      update((s) => {
        const status = { ...s.jobStatusById };
        const meta = { ...s.jobMetaById };
        delete status[jobId];
        delete meta[jobId];
        return { ...s, jobStatusById: status, jobMetaById: meta };
      }),
    addComment: (comment) =>
      update((s) => ({
        ...s,
        commentsByJobId: {
          ...s.commentsByJobId,
          [comment.jobId]: [...(s.commentsByJobId[comment.jobId] ?? []), comment],
        },
      })),
    logAudit: (actor, action, entity) =>
      update((s) => ({
        ...s,
        audit: [
          {
            id: `a_${Date.now()}_${s.audit.length}`,
            at: new Date().toISOString().slice(0, 16).replace("T", " "),
            actor,
            action,
            entity,
          },
          ...s.audit,
        ],
      })),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
