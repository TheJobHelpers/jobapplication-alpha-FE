// Typed mock API. Every screen reads through these async fetchers so that
// swapping fixtures for FastAPI calls later means editing only this file.
//
// The shapes here ARE the API contract the backend will implement.

import {
  CLIENTS,
  CURRENT_WEEK,
  GENERIC_CANDIDATES,
  JOBS,
  SEARCH_CANDIDATES,
  TEAM,
  TODAY_ITEMS,
} from "./fixtures";
import type { ApplicationJob, Client, TeamMember, TodayItem } from "./types";

export * from "./types";
export { CURRENT_WEEK };

// Simulate network latency so loading states are exercised in dev.
function resolve<T>(value: T, ms = 120): Promise<T> {
  return new Promise((r) => setTimeout(() => r(value), ms));
}

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
  getTodayItems(): Promise<TodayItem[]> {
    return resolve(TODAY_ITEMS);
  },

  // Returns the candidate jobs a background search surfaces for a client.
  // The workspace streams these into the shortlist to mimic live results.
  runSearch(clientId: string): Promise<ApplicationJob[]> {
    const bespoke = SEARCH_CANDIDATES[clientId];
    if (bespoke) return resolve(bespoke, 0);

    const client = CLIENTS.find((c) => c.id === clientId);
    const titles = client?.preferences?.titles ?? [];
    const generic = GENERIC_CANDIDATES.map((c, i) => ({
      ...c,
      id: `${clientId}_${c.id}`,
      clientId,
      clientName: client?.name ?? "Client",
      title: titles[i % Math.max(titles.length, 1)] ?? c.title,
    }));
    return resolve(generic, 0);
  },
};
