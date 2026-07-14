"use client";

// Write layer over the backend. Each mutation calls the API (so it persists) and
// optimistically updates an in-memory overlay so the UI reacts instantly. The
// overlay is NOT persisted to localStorage: on load it starts empty and reads
// come straight from the backend (already the source of truth), so a stale
// overlay can never mask real data. Overlays only hold this session's not-yet-
// refetched optimistic changes.
//
// Job status has two setters: setJobStatus (staff — PATCH /jobs + overlay) and
// applyLocalJobStatus (overlay only — the client portal drives status through
// /me/* endpoints and just mirrors the result here).

import { createContext, useContext, useMemo, useState } from "react";
import {
  api,
  type AuditEntry,
  type Client,
  type ClientDocument,
  type ClientPreferences,
  type ClientStage,
  type JobComment,
  type JobSource,
  type JobStatus,
  type MemberType,
  type QuestionnaireState,
  type QuestionnaireStatus,
  type RejectCategory,
  type Role,
  type TeamMember,
} from "@/lib/api";

// Reason/category attached to a status override (client declines carry these
// so the team's views show the why, per DESIGN.md's reasons-always rule).
export interface JobStatusMeta {
  reason?: string;
  rejectCategory?: RejectCategory;
}

interface StoreShape {
  clients: Client[]; // created this session (backend has them too on reload)
  members: TeamMember[]; // created this session
  stageById: Record<string, ClientStage>;
  questionnaireById: Record<string, QuestionnaireState>;
  preferencesById: Record<string, ClientPreferences>;
  documentsById: Record<string, ClientDocument[]>;
  tierQuotas: Record<string, number>;
  sourcesEnabled: Partial<Record<JobSource, boolean>>;
  audit: AuditEntry[]; // optimistic entries (server logs its own copy)
  jobStatusById: Record<string, JobStatus>;
  jobMetaById: Record<string, JobStatusMeta>;
  commentsByJobId: Record<string, JobComment[]>;
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
  addClient: (input: {
    name: string;
    email: string;
    tier: string;
    ownerId: string;
    quotaApps: number;
    approvalRequired: boolean;
  }) => Promise<Client>;
  addMember: (input: {
    name: string;
    email: string;
    role: Role;
    memberType?: MemberType;
    capacity: number;
  }) => Promise<TeamMember>;
  setStage: (clientId: string, stage: ClientStage) => void;
  sendQuestionnaire: (clientId: string) => void;
  setQuestionnaireStatus: (clientId: string, status: QuestionnaireStatus) => void;
  setPreferences: (clientId: string, prefs: ClientPreferences) => void;
  upsertDocument: (
    clientId: string,
    kind: ClientDocument["kind"],
    fileName: string,
    uploadedBy: string,
  ) => void;
  setTierQuota: (tier: string, quota: number) => void;
  setSourceEnabled: (source: JobSource, enabled: boolean) => void;
  logAudit: (actor: string, action: string, entity: string) => void;
  setJobStatus: (jobId: string, status: JobStatus, meta?: JobStatusMeta) => void;
  assignJob: (jobId: string, assignedToId: string) => void;
  applyLocalJobStatus: (jobId: string, status: JobStatus, meta?: JobStatusMeta) => void;
  clearJobStatus: (jobId: string) => void;
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

// Merge a client's backend documents with this session's uploads (uploads win
// per kind).
export function effectiveDocuments(
  base: ClientDocument[],
  overrides: ClientDocument[] | undefined,
): ClientDocument[] {
  if (!overrides || overrides.length === 0) return base;
  const kinds = new Set(overrides.map((d) => d.kind));
  return [...overrides, ...base.filter((d) => !kinds.has(d.kind))];
}

const Ctx = createContext<StoreCtx | null>(null);

// Surface a mutation failure without crashing the optimistic UI. Alpha: log it;
// a toast layer can hook in here later.
function reportError(label: string) {
  return (err: unknown) => console.error(`[store] ${label} failed:`, err);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [store, setStore] = useState<StoreShape>(EMPTY);

  const value = useMemo<StoreCtx>(() => {
    // Optimistic overlay update (functional, so batched mutations compose).
    const update = (fn: (prev: StoreShape) => StoreShape) => setStore(fn);
    const today = () => new Date().toISOString().slice(0, 10);

    const setLocalStatus = (jobId: string, status: JobStatus, meta?: JobStatusMeta) =>
      update((s) => ({
        ...s,
        jobStatusById: { ...s.jobStatusById, [jobId]: status },
        jobMetaById: meta ? { ...s.jobMetaById, [jobId]: meta } : s.jobMetaById,
      }));

    return {
      ...store,

      addClient: async (input) => {
        const created = await api.createClient(input);
        update((s) => ({ ...s, clients: [created, ...s.clients] }));
        return created;
      },

      addMember: async (input) => {
        const created = await api.createMember(input);
        update((s) => ({ ...s, members: [created, ...s.members] }));
        return created;
      },

      setStage: (clientId, stage) => {
        update((s) => ({ ...s, stageById: { ...s.stageById, [clientId]: stage } }));
        api.patchClient(clientId, { stage }).catch(reportError("setStage"));
      },

      sendQuestionnaire: (clientId) => {
        // Optimistic "sent" now; reconcile with the server token on response.
        update((s) => ({
          ...s,
          questionnaireById: {
            ...s.questionnaireById,
            [clientId]: { status: "sent", sentAt: today() },
          },
        }));
        api
          .sendQuestionnaire(clientId)
          .then((state) =>
            update((s) => ({
              ...s,
              questionnaireById: { ...s.questionnaireById, [clientId]: state },
            })),
          )
          .catch(reportError("sendQuestionnaire"));
      },

      setQuestionnaireStatus: (clientId, status) => {
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
        });
        api.patchQuestionnaire(clientId, status).catch(reportError("setQuestionnaireStatus"));
      },

      setPreferences: (clientId, prefs) => {
        update((s) => ({
          ...s,
          preferencesById: { ...s.preferencesById, [clientId]: prefs },
        }));
        api.putPreferences(clientId, prefs).catch(reportError("setPreferences"));
      },

      upsertDocument: (clientId, kind, fileName, uploadedBy) => {
        update((s) => {
          const existing = s.documentsById[clientId] ?? [];
          const doc: ClientDocument = { kind, fileName, uploadedAt: today(), uploadedBy };
          return {
            ...s,
            documentsById: {
              ...s.documentsById,
              [clientId]: [doc, ...existing.filter((d) => d.kind !== kind)],
            },
          };
        });
        api.upsertDocument(clientId, kind, fileName).catch(reportError("upsertDocument"));
      },

      setTierQuota: (tier, quota) => {
        update((s) => ({ ...s, tierQuotas: { ...s.tierQuotas, [tier]: quota } }));
        api.patchQuotaTier(tier, quota).catch(reportError("setTierQuota"));
      },

      setSourceEnabled: (source, enabled) => {
        update((s) => ({
          ...s,
          sourcesEnabled: { ...s.sourcesEnabled, [source]: enabled },
        }));
        api.patchSource(source, enabled).catch(reportError("setSourceEnabled"));
      },

      setJobStatus: (jobId, status, meta) => {
        setLocalStatus(jobId, status, meta);
        api
          .patchJob(jobId, {
            status,
            reason: meta?.reason,
            rejectCategory: meta?.rejectCategory,
          })
          .catch(reportError("setJobStatus"));
      },

      assignJob: (jobId, assignedToId) => {
        setLocalStatus(jobId, "assigned");
        api
          .patchJob(jobId, { status: "assigned", assignedToId })
          .catch(reportError("assignJob"));
      },

      // Overlay only — the caller already persisted via /me/* (client portal).
      applyLocalJobStatus: setLocalStatus,

      clearJobStatus: (jobId) =>
        update((s) => {
          const status = { ...s.jobStatusById };
          const meta = { ...s.jobMetaById };
          delete status[jobId];
          delete meta[jobId];
          return { ...s, jobStatusById: status, jobMetaById: meta };
        }),

      // Comments are persisted by the caller (staff vs /me); this stores the
      // returned comment in the overlay so the thread updates instantly.
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
  }, [store]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}
