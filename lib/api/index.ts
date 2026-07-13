// Typed mock API. Every screen reads through these async fetchers so that
// swapping fixtures for FastAPI calls later means editing only this file.
//
// The shapes here ARE the API contract the backend will implement.
// Note: search is NOT a portal feature (vault note 09). Jobs are added or
// imported; api.getImportSample mocks a bulk import.

import {
  AUDIT_LOG,
  CLIENT_DOCUMENTS,
  CLIENTS,
  CURRENT_WEEK,
  GENERIC_IMPORT,
  IMPORT_SAMPLES,
  JOBS,
  QUOTA_TIERS,
  TEAM,
  TODAY,
} from "./fixtures";
import type {
  ApplicationJob,
  AuditEntry,
  Client,
  ClientDocument,
  JobStatus,
  QuotaTier,
  TeamMember,
  TeamWorkload,
} from "./types";

export * from "./types";
export { CURRENT_WEEK, TODAY };

// Simulate network latency so loading states are exercised in dev.
function resolve<T>(value: T, ms = 120): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

const ACTIVE: Set<JobStatus> = new Set([
  "in_progress",
  "assigned",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "blocked",
]);

// Anything not touched since this date (5 days before the fixture "today") and
// still active counts as stale.
const STALE_BEFORE = "2026-07-09";

export const api = {
  getTeam(): Promise<TeamMember[]> {
    return resolve(TEAM);
  },
  getClients(): Promise<Client[]> {
    return resolve(CLIENTS);
  },
  getClient(id: string): Promise<Client | undefined> {
    return resolve(CLIENTS.find((c) => c.id === id));
  },
  getJobs(): Promise<ApplicationJob[]> {
    return resolve(JOBS);
  },
  getJobsForClient(clientId: string): Promise<ApplicationJob[]> {
    return resolve(JOBS.filter((j) => j.clientId === clientId));
  },
  getAuditLog(): Promise<AuditEntry[]> {
    return resolve(AUDIT_LOG);
  },
  // Documents on file for a client (workspace Documents tab, client Profile).
  getDocuments(clientId: string): Promise<ClientDocument[]> {
    return resolve(CLIENT_DOCUMENTS[clientId] ?? []);
  },
  getQuotaTiers(): Promise<QuotaTier[]> {
    return resolve(QUOTA_TIERS);
  },

  // Per-member workload for the Team page (manager/admin oversight).
  getTeamWorkload(): Promise<TeamWorkload[]> {
    const rows = TEAM.filter((m) => m.role === "team_member" || m.role === "manager").map(
      (member): TeamWorkload => {
        const owned = CLIENTS.filter((c) => c.ownerId === member.id);
        const mine = JOBS.filter((j) => j.assignedToId === member.id);
        const active = mine.filter((j) => ACTIVE.has(j.status));
        return {
          member,
          clientCount: owned.length,
          quotaFilled: owned.reduce((s, c) => s + c.filledApps, 0),
          quotaTarget: owned.reduce((s, c) => s + c.quotaApps, 0),
          activeJobs: active.length,
          applied: mine.filter((j) => j.status === "applied").length,
          interviewing: mine.filter((j) => j.status === "interviewing").length,
          offers: mine.filter((j) => j.status === "offer").length,
          stale: active.filter((j) => j.updatedAt <= STALE_BEFORE).length,
        };
      },
    );
    return resolve(rows);
  },

  // Mocks a bulk import for a client (paste rows / upload CSV). Returns jobs to
  // drop into the shortlist. Real import happens client-side per note 09.
  getImportSample(clientId: string): Promise<ApplicationJob[]> {
    const bespoke = IMPORT_SAMPLES[clientId];
    if (bespoke) return resolve(bespoke, 250);

    const client = CLIENTS.find((c) => c.id === clientId);
    const titles = client?.preferences?.titles ?? [];
    const generic = GENERIC_IMPORT.map((c, i) => ({
      ...c,
      id: `${clientId}_${c.id}`,
      clientId,
      clientName: client?.name ?? "Client",
      title: titles[i % Math.max(titles.length, 1)] ?? c.title,
    }));
    return resolve(generic, 250);
  },
};
