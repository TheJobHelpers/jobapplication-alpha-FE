// Typed mock API. Every screen reads through these async fetchers so that
// swapping fixtures for FastAPI calls later means editing only this file.
//
// The shapes here ARE the API contract the backend will implement.

import {
  CLIENTS,
  CURRENT_WEEK,
  JOBS,
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
};
