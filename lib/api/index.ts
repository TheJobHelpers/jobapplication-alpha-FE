// Typed API client for the FastAPI backend. Every screen reads/writes through
// these fetchers; the shapes mirror the backend schemas 1:1 (camelCase both
// sides, so responses parse into the TS types with no mapping).
//
// Two audiences share one contract:
//  - `api.*`        — staff endpoints (internal portal; require a staff session)
//  - `api.me.*`     — client-portal endpoints (/me/*; a signed-in client only)
// A client principal cannot call the staff endpoints (they're gated 403), so the
// client portal MUST use api.me.*.
//
// Note: search is NOT a portal feature (vault note 09). Jobs are added or
// imported; api.getImportSample still mocks a bulk-import sample client-side.

import { apiFetch, ApiError } from "./http";
import { GENERIC_IMPORT, IMPORT_SAMPLES } from "./fixtures";
import type {
  ApplicationJob,
  AuditEntry,
  Client,
  ClientDocument,
  ClientPreferences,
  JobComment,
  JobStatus,
  MemberType,
  QuestionnaireState,
  QuestionnaireStatus,
  QuotaTier,
  RejectCategory,
  Role,
  TeamMember,
  TeamWorkload,
} from "./types";

export * from "./types";
export * from "./auth";
export { ApiError } from "./http";
export { CURRENT_WEEK, TODAY } from "./fixtures";

// ── Mutation payloads (mirror the backend *Create/*Patch schemas) ────────
export interface ClientCreateInput {
  name: string;
  email: string;
  tier: string;
  ownerId: string;
  quotaApps: number;
  approvalRequired: boolean;
}
export interface MemberCreateInput {
  name: string;
  email: string;
  role: Role;
  memberType?: MemberType;
  capacity: number;
}
export interface JobCreateInput {
  clientId: string;
  company: string;
  title: string;
  location: string;
  salary?: string;
  matchScore?: number;
  status?: JobStatus;
  addedVia?: ApplicationJob["addedVia"];
}
export interface ClientPatchInput {
  stage?: Client["stage"];
  ownerId?: string;
  tier?: string;
  quotaApps?: number;
  approvalRequired?: boolean;
}
export interface JobPatchInput {
  status?: JobStatus;
  reason?: string;
  rejectCategory?: RejectCategory;
  assignedToId?: string;
}

export const api = {
  // ── Reads (staff) ──────────────────────────────────────────────────
  getTeam(): Promise<TeamMember[]> {
    return apiFetch("/team");
  },
  getTeamWorkload(): Promise<TeamWorkload[]> {
    return apiFetch("/team/workload");
  },
  getClients(): Promise<Client[]> {
    return apiFetch("/clients");
  },
  async getClient(id: string): Promise<Client | undefined> {
    try {
      return await apiFetch<Client>(`/clients/${id}`);
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) return undefined;
      throw e;
    }
  },
  getJobs(): Promise<ApplicationJob[]> {
    return apiFetch("/jobs");
  },
  getJobsForClient(clientId: string): Promise<ApplicationJob[]> {
    return apiFetch(`/clients/${clientId}/jobs`);
  },
  getDocuments(clientId: string): Promise<ClientDocument[]> {
    return apiFetch(`/clients/${clientId}/documents`);
  },
  getJobComments(jobId: string): Promise<JobComment[]> {
    return apiFetch(`/jobs/${jobId}/comments`);
  },
  getQuotaTiers(): Promise<QuotaTier[]> {
    return apiFetch("/settings/quota-tiers");
  },
  getSources(): Promise<Record<string, boolean>> {
    return apiFetch("/settings/sources");
  },
  getAuditLog(): Promise<AuditEntry[]> {
    return apiFetch("/audit");
  },

  // ── Mutations (staff) ──────────────────────────────────────────────
  createClient(input: ClientCreateInput): Promise<Client> {
    return apiFetch("/clients", { method: "POST", body: input });
  },
  patchClient(id: string, patch: ClientPatchInput): Promise<Client> {
    return apiFetch(`/clients/${id}`, { method: "PATCH", body: patch });
  },
  putPreferences(id: string, prefs: ClientPreferences): Promise<ClientPreferences> {
    return apiFetch(`/clients/${id}/preferences`, { method: "PUT", body: prefs });
  },
  sendQuestionnaire(id: string): Promise<QuestionnaireState> {
    return apiFetch(`/clients/${id}/questionnaire/send`, { method: "POST" });
  },
  patchQuestionnaire(id: string, status: QuestionnaireStatus): Promise<QuestionnaireState> {
    return apiFetch(`/clients/${id}/questionnaire`, { method: "PATCH", body: { status } });
  },
  upsertDocument(id: string, kind: ClientDocument["kind"], fileName: string): Promise<ClientDocument> {
    return apiFetch(`/clients/${id}/documents`, { method: "POST", body: { kind, fileName } });
  },
  createJobs(jobs: JobCreateInput[]): Promise<ApplicationJob[]> {
    return apiFetch("/jobs", { method: "POST", body: jobs });
  },
  patchJob(id: string, patch: JobPatchInput): Promise<ApplicationJob> {
    return apiFetch(`/jobs/${id}`, { method: "PATCH", body: patch });
  },
  addJobComment(jobId: string, text: string): Promise<JobComment> {
    return apiFetch(`/jobs/${jobId}/comments`, { method: "POST", body: { text } });
  },
  createMember(input: MemberCreateInput): Promise<TeamMember> {
    return apiFetch("/team", { method: "POST", body: input });
  },
  patchQuotaTier(tier: string, quota: number): Promise<QuotaTier> {
    return apiFetch(`/settings/quota-tiers/${encodeURIComponent(tier)}`, {
      method: "PATCH",
      body: { quota },
    });
  },
  patchSource(source: string, enabled: boolean): Promise<Record<string, boolean>> {
    return apiFetch(`/settings/sources/${source}`, { method: "PATCH", body: { enabled } });
  },

  // ── Client portal (/me/*) — a signed-in client only ────────────────
  me: {
    getClient(): Promise<Client> {
      return apiFetch("/me/client");
    },
    getJobs(): Promise<ApplicationJob[]> {
      return apiFetch("/me/jobs");
    },
    getDocuments(): Promise<ClientDocument[]> {
      return apiFetch("/me/documents");
    },
    getJobComments(jobId: string): Promise<JobComment[]> {
      return apiFetch(`/me/jobs/${jobId}/comments`);
    },
    addJobComment(jobId: string, text: string): Promise<JobComment> {
      return apiFetch(`/me/jobs/${jobId}/comments`, { method: "POST", body: { text } });
    },
    acceptJob(jobId: string): Promise<ApplicationJob> {
      return apiFetch(`/me/jobs/${jobId}/accept`, { method: "POST" });
    },
    declineJob(jobId: string, category: RejectCategory, reason: string): Promise<ApplicationJob> {
      return apiFetch(`/me/jobs/${jobId}/decline`, {
        method: "POST",
        body: { category, reason },
      });
    },
    undoDecision(jobId: string): Promise<ApplicationJob> {
      return apiFetch(`/me/jobs/${jobId}/undo`, { method: "POST" });
    },
  },

  // Mocks a bulk import for a client (paste rows / upload CSV). Returns jobs to
  // drop into the shortlist — the real import stays client-side per note 09.
  // These are draft rows, not yet persisted; the workspace POSTs them on add.
  getImportSample(clientId: string, clientName: string, titles: string[] = []): Promise<ApplicationJob[]> {
    const bespoke = IMPORT_SAMPLES[clientId];
    if (bespoke) return Promise.resolve(bespoke);
    const generic = GENERIC_IMPORT.map((c, i) => ({
      ...c,
      id: `${clientId}_${c.id}`,
      clientId,
      clientName,
      title: titles[i % Math.max(titles.length, 1)] ?? c.title,
    }));
    return Promise.resolve(generic);
  },
};
