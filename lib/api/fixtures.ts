// Mock fixtures for frontend-first development (build order D5).
// Deterministic data — no Date.now()/random — so screens render identically
// on every load. Replaced by real API responses when apps/api lands.

import type { ApplicationJob, Client, TeamMember, TodayItem } from "./types";

export const CURRENT_WEEK = 29;

export const TEAM: TeamMember[] = [
  { id: "u_admin", name: "Ops Admin", role: "admin", activeClients: 0, capacity: 0 },
  { id: "u_mgr", name: "M. Perera", role: "manager", activeClients: 6, capacity: 12 },
  { id: "u_ja1", name: "S. Fernando", role: "team_member", memberType: "ja", activeClients: 5, capacity: 8 },
  { id: "u_ja2", name: "N. Jayasuriya", role: "team_member", memberType: "ja", activeClients: 7, capacity: 8 },
  { id: "u_js1", name: "R. Gunawardena", role: "team_member", memberType: "js", activeClients: 4, capacity: 8 },
  { id: "u_js2", name: "T. Wickrama", role: "team_member", memberType: "js", activeClients: 6, capacity: 8 },
];

export const CLIENTS: Client[] = [
  { id: "c_amara", name: "Amara Silva", stage: "active", tier: "Tier 2", ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 10, filledApps: 6, approvalRequired: true },
  { id: "c_dev", name: "Devin Cross", stage: "active", tier: "Tier 1", ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 12, filledApps: 11, approvalRequired: false },
  { id: "c_lena", name: "Lena Ortiz", stage: "active", tier: "Tier 3", ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 8, filledApps: 2, approvalRequired: true },
  { id: "c_marco", name: "Marco Bianchi", stage: "onboarding", tier: "Tier 2", ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 10, filledApps: 0, approvalRequired: true },
  { id: "c_priya", name: "Priya Nair", stage: "active", tier: "Tier 1", ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 12, filledApps: 9, approvalRequired: true },
  { id: "c_sam", name: "Sam Whitfield", stage: "paused", tier: "Tier 3", ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 8, filledApps: 0, approvalRequired: false },
];

export const JOBS: ApplicationJob[] = [
  { id: "j1", clientId: "c_amara", clientName: "Amara Silva", company: "Stripe", title: "Senior Product Manager", location: "Remote (US)", salary: "$180k–$210k", matchScore: 0.92, status: "client_review", updatedAt: "2026-07-13" },
  { id: "j2", clientId: "c_amara", clientName: "Amara Silva", company: "Wise", title: "Product Lead", location: "New York, NY", salary: "$170k–$200k", matchScore: 0.87, status: "applied", assignedToId: "u_ja1", assignedToName: "S. Fernando", postedAt: "2026-07-09", updatedAt: "2026-07-12" },
  { id: "j3", clientId: "c_amara", clientName: "Amara Silva", company: "Ramp", title: "Group PM, Payments", location: "Remote (US)", salary: "$190k–$220k", matchScore: 0.81, status: "rejected", rejectCategory: "location", reason: "Prefers fully remote; role is hybrid 3 days in NYC.", updatedAt: "2026-07-11" },
  { id: "j4", clientId: "c_dev", clientName: "Devin Cross", company: "Datadog", title: "Staff Engineer", location: "Remote (US)", salary: "$210k–$250k", matchScore: 0.9, status: "interviewing", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", postedAt: "2026-07-02", updatedAt: "2026-07-13" },
  { id: "j5", clientId: "c_dev", clientName: "Devin Cross", company: "Vercel", title: "Senior Software Engineer", location: "Remote", salary: "$180k–$220k", matchScore: 0.85, status: "blocked", reason: "Application portal requires a US phone number we don't have on file.", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", updatedAt: "2026-07-12" },
  { id: "j6", clientId: "c_priya", clientName: "Priya Nair", company: "Notion", title: "Product Designer", location: "San Francisco, CA", salary: "$160k–$190k", matchScore: 0.88, status: "assigned", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", updatedAt: "2026-07-13" },
  { id: "j7", clientId: "c_priya", clientName: "Priya Nair", company: "Figma", title: "Senior Product Designer", location: "Remote (US)", salary: "$170k–$200k", matchScore: 0.83, status: "applying", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", updatedAt: "2026-07-13" },
  { id: "j8", clientId: "c_lena", clientName: "Lena Ortiz", company: "Airtable", title: "Marketing Manager", location: "Remote (US)", salary: "$120k–$145k", matchScore: 0.79, status: "sourced", updatedAt: "2026-07-13" },
  { id: "j9", clientId: "c_lena", clientName: "Lena Ortiz", company: "HubSpot", title: "Growth Marketing Lead", location: "Boston, MA", salary: "$135k–$160k", matchScore: 0.76, status: "offer", assignedToId: "u_ja1", assignedToName: "S. Fernando", postedAt: "2026-06-20", updatedAt: "2026-07-10" },
];

export const TODAY_ITEMS: TodayItem[] = [
  { id: "t1", kind: "quota", urgency: "danger", title: "Amara Silva is 4 jobs short of quota", detail: "6 / 10 applications this week", meta: "Week ends in 2 days", clientId: "c_amara", action: { label: "Open workspace", href: "/admin/clients/c_amara" } },
  { id: "t2", kind: "quota", urgency: "danger", title: "Lena Ortiz is 6 jobs short of quota", detail: "2 / 8 applications this week", meta: "Week ends in 2 days", clientId: "c_lena", action: { label: "Open workspace", href: "/admin/clients/c_lena" } },
  { id: "t3", kind: "blocked", urgency: "danger", title: "Blocked: Senior Software Engineer at Vercel", detail: "Needs a US phone number on file — Devin Cross", clientId: "c_dev", action: { label: "Resolve", href: "/admin/clients/c_dev" } },
  { id: "t4", kind: "search_done", urgency: "positive", title: "Search finished for Amara Silva", detail: "18 results, top match 0.92", clientId: "c_amara", action: { label: "Review shortlist", href: "/admin/clients/c_amara" } },
  { id: "t5", kind: "status_update", urgency: "warning", title: "3 applications haven't moved in 5+ days", detail: "Devin Cross, Priya Nair", action: { label: "Open pipeline", href: "/admin/pipeline" } },
  { id: "t6", kind: "intake", urgency: "info", title: "Questionnaire completed for Marco Bianchi", detail: "Preferences ready — review and move to Active", clientId: "c_marco", action: { label: "Open workspace", href: "/admin/clients/c_marco" } },
];
