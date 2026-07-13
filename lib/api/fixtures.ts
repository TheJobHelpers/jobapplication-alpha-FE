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
  {
    id: "c_amara", name: "Amara Silva", stage: "active", tier: "Tier 2",
    ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 10, filledApps: 6, approvalRequired: true,
    preferences: { titles: ["Senior Product Manager", "Product Lead", "Group PM"], locations: ["Remote (US)", "New York, NY"], workType: "remote", salaryMin: 170000, salaryMax: 220000, sources: ["indeed", "linkedin", "jsearch"] },
  },
  {
    id: "c_dev", name: "Devin Cross", stage: "active", tier: "Tier 1",
    ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 12, filledApps: 11, approvalRequired: false,
    preferences: { titles: ["Staff Engineer", "Senior Software Engineer"], locations: ["Remote (US)"], workType: "remote", salaryMin: 190000, salaryMax: 250000, sources: ["linkedin", "jsearch"] },
  },
  {
    id: "c_lena", name: "Lena Ortiz", stage: "active", tier: "Tier 3",
    ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 8, filledApps: 2, approvalRequired: true,
    preferences: { titles: ["Marketing Manager", "Growth Marketing Lead"], locations: ["Remote (US)", "Boston, MA"], workType: "hybrid", salaryMin: 120000, salaryMax: 160000, sources: ["indeed", "linkedin"] },
  },
  {
    id: "c_marco", name: "Marco Bianchi", stage: "onboarding", tier: "Tier 2",
    ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 10, filledApps: 0, approvalRequired: true,
    preferences: { titles: ["Data Analyst", "Business Analyst"], locations: ["Chicago, IL", "Remote (US)"], workType: "any", salaryMin: 95000, salaryMax: 130000, sources: ["indeed", "jsearch"] },
  },
  {
    id: "c_priya", name: "Priya Nair", stage: "active", tier: "Tier 1",
    ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 12, filledApps: 9, approvalRequired: true,
    preferences: { titles: ["Product Designer", "Senior Product Designer"], locations: ["San Francisco, CA", "Remote (US)"], workType: "hybrid", salaryMin: 150000, salaryMax: 200000, sources: ["linkedin", "jsearch"] },
  },
  {
    id: "c_sam", name: "Sam Whitfield", stage: "paused", tier: "Tier 3",
    ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 8, filledApps: 0, approvalRequired: false,
    preferences: { titles: ["Sales Manager", "Account Executive"], locations: ["Austin, TX"], workType: "onsite", salaryMin: 110000, salaryMax: 150000, sources: ["indeed"] },
  },
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

// Candidate jobs a background search "finds" for a client. The workspace search
// panel streams these into the shortlist one at a time to mimic live results.
// Keyed by client id; falls back to a generic set (see api.runSearch).
export const SEARCH_CANDIDATES: Record<string, ApplicationJob[]> = {
  c_amara: [
    { id: "s_am1", clientId: "c_amara", clientName: "Amara Silva", company: "Airbnb", title: "Senior Product Manager, Payments", location: "Remote (US)", salary: "$185k–$215k", matchScore: 0.94, status: "sourced", updatedAt: "2026-07-13" },
    { id: "s_am2", clientId: "c_amara", clientName: "Amara Silva", company: "Plaid", title: "Product Lead, Platform", location: "New York, NY", salary: "$175k–$205k", matchScore: 0.89, status: "sourced", updatedAt: "2026-07-13" },
    { id: "s_am3", clientId: "c_amara", clientName: "Amara Silva", company: "Brex", title: "Group Product Manager", location: "Remote (US)", salary: "$190k–$225k", matchScore: 0.86, status: "sourced", updatedAt: "2026-07-13" },
    { id: "s_am4", clientId: "c_amara", clientName: "Amara Silva", company: "Gusto", title: "Senior PM, Growth", location: "Remote (US)", salary: "$170k–$200k", matchScore: 0.82, status: "sourced", updatedAt: "2026-07-13" },
    { id: "s_am5", clientId: "c_amara", clientName: "Amara Silva", company: "Mercury", title: "Product Manager, Banking", location: "New York, NY", salary: "$165k–$195k", matchScore: 0.78, status: "sourced", updatedAt: "2026-07-13" },
  ],
};

// Generic candidates for clients without a bespoke set — reshaped per client
// in api.runSearch so names/scores look plausible.
export const GENERIC_CANDIDATES: Omit<ApplicationJob, "clientId" | "clientName">[] = [
  { id: "g1", company: "Acme Corp", title: "Senior Specialist", location: "Remote (US)", salary: "$140k–$170k", matchScore: 0.9, status: "sourced", updatedAt: "2026-07-13" },
  { id: "g2", company: "Northwind", title: "Team Lead", location: "Remote (US)", salary: "$135k–$165k", matchScore: 0.85, status: "sourced", updatedAt: "2026-07-13" },
  { id: "g3", company: "Globex", title: "Senior Associate", location: "Hybrid", salary: "$125k–$155k", matchScore: 0.8, status: "sourced", updatedAt: "2026-07-13" },
  { id: "g4", company: "Initech", title: "Manager", location: "Onsite", salary: "$120k–$150k", matchScore: 0.74, status: "sourced", updatedAt: "2026-07-13" },
];

export const TODAY_ITEMS: TodayItem[] = [
  { id: "t1", kind: "quota", urgency: "danger", title: "Amara Silva is 4 jobs short of quota", detail: "6 / 10 applications this week", meta: "Week ends in 2 days", clientId: "c_amara", action: { label: "Open workspace", href: "/admin/clients/c_amara" } },
  { id: "t2", kind: "quota", urgency: "danger", title: "Lena Ortiz is 6 jobs short of quota", detail: "2 / 8 applications this week", meta: "Week ends in 2 days", clientId: "c_lena", action: { label: "Open workspace", href: "/admin/clients/c_lena" } },
  { id: "t3", kind: "blocked", urgency: "danger", title: "Blocked: Senior Software Engineer at Vercel", detail: "Needs a US phone number on file — Devin Cross", clientId: "c_dev", action: { label: "Resolve", href: "/admin/clients/c_dev" } },
  { id: "t4", kind: "search_done", urgency: "positive", title: "Search finished for Amara Silva", detail: "18 results, top match 0.92", clientId: "c_amara", action: { label: "Review shortlist", href: "/admin/clients/c_amara" } },
  { id: "t5", kind: "status_update", urgency: "warning", title: "3 applications haven't moved in 5+ days", detail: "Devin Cross, Priya Nair", action: { label: "Open pipeline", href: "/admin/pipeline" } },
  { id: "t6", kind: "intake", urgency: "info", title: "Questionnaire completed for Marco Bianchi", detail: "Preferences ready — review and move to Active", clientId: "c_marco", action: { label: "Open workspace", href: "/admin/clients/c_marco" } },
];
