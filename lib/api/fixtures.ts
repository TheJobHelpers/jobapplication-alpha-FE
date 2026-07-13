// Mock fixtures for frontend-first development (build order D5).
// Deterministic data — no Date.now()/random — so screens render identically
// on every load. Replaced by real API responses when apps/api lands.

import type {
  ApplicationJob,
  AuditEntry,
  Client,
  ClientDocument,
  QuotaTier,
  TeamMember,
} from "./types";

export const CURRENT_WEEK = 29;
export const TODAY = "2026-07-13"; // fixture "today", used when adding jobs

export const TEAM: TeamMember[] = [
  { id: "u_admin", name: "Ops Admin", role: "admin", activeClients: 0, capacity: 0 },
  { id: "u_mgr", name: "M. Perera", role: "manager", activeClients: 6, capacity: 12 },
  { id: "u_ja1", name: "S. Fernando", role: "team_member", memberType: "ja", activeClients: 5, capacity: 8 },
  { id: "u_ja2", name: "N. Jayasuriya", role: "team_member", memberType: "ja", activeClients: 7, capacity: 8 },
  { id: "u_js1", name: "R. Gunawardena", role: "team_member", memberType: "js", activeClients: 4, capacity: 8, sourcedThisWeek: 42 },
  { id: "u_js2", name: "T. Wickrama", role: "team_member", memberType: "js", activeClients: 6, capacity: 8, sourcedThisWeek: 57 },
];

export const CLIENTS: Client[] = [
  {
    id: "c_amara", name: "Ashley Bennett", stage: "active", tier: "Tier 2",
    ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 10, filledApps: 6, approvalRequired: true,
    preferences: { titles: ["Senior Product Manager", "Product Lead", "Group PM"], locations: ["Remote (US)", "New York, NY"], workType: "remote", salaryMin: 170000, salaryMax: 220000, sources: ["indeed", "linkedin", "jsearch"] },
  },
  {
    id: "c_dev", name: "Devin Cross", stage: "active", tier: "Tier 1",
    ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 12, filledApps: 11, approvalRequired: false,
    preferences: { titles: ["Staff Engineer", "Senior Software Engineer"], locations: ["Remote (US)"], workType: "remote", salaryMin: 190000, salaryMax: 250000, sources: ["linkedin", "jsearch"] },
  },
  {
    id: "c_lena", name: "Lauren Mitchell", stage: "active", tier: "Tier 3",
    ownerId: "u_ja1", ownerName: "S. Fernando", quotaApps: 8, filledApps: 2, approvalRequired: true,
    preferences: { titles: ["Marketing Manager", "Growth Marketing Lead"], locations: ["Remote (US)", "Boston, MA"], workType: "hybrid", salaryMin: 120000, salaryMax: 160000, sources: ["indeed", "linkedin"] },
  },
  {
    id: "c_marco", name: "Michael Carter", stage: "onboarding", tier: "Tier 2",
    ownerId: "u_ja2", ownerName: "N. Jayasuriya", quotaApps: 10, filledApps: 0, approvalRequired: true,
    preferences: { titles: ["Data Analyst", "Business Analyst"], locations: ["Chicago, IL", "Remote (US)"], workType: "any", salaryMin: 95000, salaryMax: 130000, sources: ["indeed", "jsearch"] },
    questionnaire: { status: "sent", token: "tok_marco_seed", sentAt: "2026-07-12" },
  },
  {
    id: "c_priya", name: "Paige Sullivan", stage: "active", tier: "Tier 1",
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
  // Ashley Bennett
  { id: "j1", clientId: "c_amara", clientName: "Ashley Bennett", company: "Stripe", title: "Senior Product Manager", location: "Remote (US)", salary: "$180k–$210k", matchScore: 0.92, status: "client_review", addedVia: "import", updatedAt: "2026-07-13" },
  { id: "j10", clientId: "c_amara", clientName: "Ashley Bennett", company: "Coinbase", title: "Group PM", location: "Remote (US)", salary: "$185k–$215k", matchScore: 0.84, status: "approved", addedVia: "import", updatedAt: "2026-07-12" },
  { id: "j11", clientId: "c_amara", clientName: "Ashley Bennett", company: "Affirm", title: "Product Manager, Risk", location: "New York, NY", salary: "$175k–$205k", matchScore: 0.8, status: "in_progress", updatedAt: "2026-07-12" },
  { id: "j2", clientId: "c_amara", clientName: "Ashley Bennett", company: "Wise", title: "Product Lead", location: "New York, NY", salary: "$170k–$200k", matchScore: 0.87, status: "applied", assignedToId: "u_ja1", assignedToName: "S. Fernando", postedAt: "2026-07-09", updatedAt: "2026-07-12" },
  { id: "j3", clientId: "c_amara", clientName: "Ashley Bennett", company: "Ramp", title: "Group PM, Payments", location: "Remote (US)", salary: "$190k–$220k", matchScore: 0.81, status: "rejected", rejectCategory: "location", reason: "Prefers fully remote; role is hybrid 3 days in NYC.", updatedAt: "2026-07-11" },

  // Devin Cross
  { id: "j20", clientId: "c_dev", clientName: "Devin Cross", company: "Linear", title: "Senior Software Engineer", location: "Remote (US)", salary: "$185k–$225k", matchScore: 0.83, status: "sourced", addedVia: "manual", updatedAt: "2026-07-13" },
  { id: "j4", clientId: "c_dev", clientName: "Devin Cross", company: "Datadog", title: "Staff Engineer", location: "Remote (US)", salary: "$210k–$250k", matchScore: 0.9, status: "interviewing", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", postedAt: "2026-07-02", updatedAt: "2026-07-13" },
  { id: "j12", clientId: "c_dev", clientName: "Devin Cross", company: "Cloudflare", title: "Staff Engineer, Platform", location: "Remote (US)", salary: "$200k–$240k", matchScore: 0.88, status: "applied", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", postedAt: "2026-07-08", updatedAt: "2026-07-11" },
  { id: "j5", clientId: "c_dev", clientName: "Devin Cross", company: "Vercel", title: "Senior Software Engineer", location: "Remote", salary: "$180k–$220k", matchScore: 0.85, status: "blocked", reason: "Application portal requires a US phone number we don't have on file.", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", updatedAt: "2026-07-12" },
  { id: "j13", clientId: "c_dev", clientName: "Devin Cross", company: "Retool", title: "Senior Engineer", location: "Remote (US)", salary: "$180k–$210k", matchScore: 0.7, status: "closed", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", updatedAt: "2026-07-05" },

  // Paige Sullivan
  { id: "j14", clientId: "c_priya", clientName: "Paige Sullivan", company: "Airbnb", title: "Product Designer", location: "San Francisco, CA", salary: "$165k–$195k", matchScore: 0.86, status: "client_review", addedVia: "import", updatedAt: "2026-07-13" },
  { id: "j6", clientId: "c_priya", clientName: "Paige Sullivan", company: "Notion", title: "Product Designer", location: "San Francisco, CA", salary: "$160k–$190k", matchScore: 0.88, status: "assigned", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", updatedAt: "2026-07-13" },
  { id: "j7", clientId: "c_priya", clientName: "Paige Sullivan", company: "Figma", title: "Senior Product Designer", location: "Remote (US)", salary: "$170k–$200k", matchScore: 0.83, status: "applying", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", updatedAt: "2026-07-13" },
  { id: "j15", clientId: "c_priya", clientName: "Paige Sullivan", company: "Loom", title: "Senior Designer", location: "Remote (US)", salary: "$160k–$185k", matchScore: 0.9, status: "interviewing", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", postedAt: "2026-07-01", updatedAt: "2026-07-12" },
  { id: "j19", clientId: "c_priya", clientName: "Paige Sullivan", company: "Webflow", title: "Product Designer, Growth", location: "Remote (US)", salary: "$170k–$195k", matchScore: 0.91, status: "offer", assignedToId: "u_ja2", assignedToName: "N. Jayasuriya", postedAt: "2026-06-18", updatedAt: "2026-07-09" },

  // Lauren Mitchell
  { id: "j8", clientId: "c_lena", clientName: "Lauren Mitchell", company: "Airtable", title: "Marketing Manager", location: "Remote (US)", salary: "$120k–$145k", matchScore: 0.79, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
  { id: "j16", clientId: "c_lena", clientName: "Lauren Mitchell", company: "Zapier", title: "Growth Marketing Lead", location: "Remote (US)", salary: "$130k–$155k", matchScore: 0.82, status: "assigned", assignedToId: "u_ja1", assignedToName: "S. Fernando", updatedAt: "2026-07-13" },
  { id: "j17", clientId: "c_lena", clientName: "Lauren Mitchell", company: "Klaviyo", title: "Lifecycle Marketing Manager", location: "Boston, MA", salary: "$125k–$150k", status: "expired", reason: "Posting was taken down before we applied.", updatedAt: "2026-07-08" },
  { id: "j9", clientId: "c_lena", clientName: "Lauren Mitchell", company: "HubSpot", title: "Growth Marketing Lead", location: "Boston, MA", salary: "$135k–$160k", matchScore: 0.76, status: "offer", assignedToId: "u_ja1", assignedToName: "S. Fernando", postedAt: "2026-06-20", updatedAt: "2026-07-10" },

  // Michael Carter (onboarding — just a couple of freshly sourced)
  { id: "j18", clientId: "c_marco", clientName: "Michael Carter", company: "Snowflake", title: "Data Analyst", location: "Chicago, IL", salary: "$100k–$125k", matchScore: 0.75, status: "sourced", addedVia: "manual", updatedAt: "2026-07-13" },
];

// Sample jobs a bulk import would produce for a client (paste rows / upload CSV).
// The workspace and Quick-Add "Import" tab drop these into the shortlist to mimic
// a real import. Keyed by client id; falls back to a generic set.
export const IMPORT_SAMPLES: Record<string, ApplicationJob[]> = {
  c_amara: [
    { id: "s_am1", clientId: "c_amara", clientName: "Ashley Bennett", company: "Airbnb", title: "Senior Product Manager, Payments", location: "Remote (US)", salary: "$185k–$215k", matchScore: 0.94, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
    { id: "s_am2", clientId: "c_amara", clientName: "Ashley Bennett", company: "Plaid", title: "Product Lead, Platform", location: "New York, NY", salary: "$175k–$205k", matchScore: 0.89, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
    { id: "s_am3", clientId: "c_amara", clientName: "Ashley Bennett", company: "Brex", title: "Group Product Manager", location: "Remote (US)", salary: "$190k–$225k", matchScore: 0.86, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
    { id: "s_am4", clientId: "c_amara", clientName: "Ashley Bennett", company: "Gusto", title: "Senior PM, Growth", location: "Remote (US)", salary: "$170k–$200k", matchScore: 0.82, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
    { id: "s_am5", clientId: "c_amara", clientName: "Ashley Bennett", company: "Mercury", title: "Product Manager, Banking", location: "New York, NY", salary: "$165k–$195k", matchScore: 0.78, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
  ],
};

// Generic import batch for clients without a bespoke set — reshaped per client
// in api.getImportSample so titles/names look plausible.
export const GENERIC_IMPORT: Omit<ApplicationJob, "clientId" | "clientName">[] = [
  { id: "g1", company: "Acme Corp", title: "Senior Specialist", location: "Remote (US)", salary: "$140k–$170k", matchScore: 0.9, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
  { id: "g2", company: "Northwind", title: "Team Lead", location: "Remote (US)", salary: "$135k–$165k", matchScore: 0.85, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
  { id: "g3", company: "Globex", title: "Senior Associate", location: "Hybrid", salary: "$125k–$155k", matchScore: 0.8, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
  { id: "g4", company: "Initech", title: "Manager", location: "Onsite", salary: "$120k–$150k", matchScore: 0.74, status: "sourced", addedVia: "import", updatedAt: "2026-07-13" },
];

// Documents on file per client. Michael Carter is mid-onboarding, so his are
// mostly missing — the workspace Documents tab and onboarding checklist react.
export const CLIENT_DOCUMENTS: Record<string, ClientDocument[]> = {
  c_amara: [
    { kind: "resume", fileName: "ashley-bennett-resume-2026.pdf", uploadedAt: "2026-06-02", uploadedBy: "Ashley Bennett" },
    { kind: "cover_letter", fileName: "ashley-cover-base.docx", uploadedAt: "2026-06-02", uploadedBy: "Ashley Bennett" },
    { kind: "cqfo", fileName: "cqfo-ashley-bennett.pdf", uploadedAt: "2026-06-05", uploadedBy: "System" },
  ],
  c_dev: [
    { kind: "resume", fileName: "devin-cross-resume.pdf", uploadedAt: "2026-05-18", uploadedBy: "Devin Cross" },
    { kind: "cover_letter", fileName: "devin-cover-template.docx", uploadedAt: "2026-05-18", uploadedBy: "Devin Cross" },
    { kind: "doc360", fileName: "devin-360-review.pdf", uploadedAt: "2026-05-24", uploadedBy: "M. Perera" },
    { kind: "cqfo", fileName: "cqfo-devin-cross.pdf", uploadedAt: "2026-05-20", uploadedBy: "System" },
  ],
  c_lena: [
    { kind: "resume", fileName: "lauren-mitchell-resume.pdf", uploadedAt: "2026-06-20", uploadedBy: "Lauren Mitchell" },
    { kind: "cqfo", fileName: "cqfo-lauren-mitchell.pdf", uploadedAt: "2026-06-24", uploadedBy: "System" },
  ],
  c_marco: [
    { kind: "resume", fileName: "michael-carter-resume.pdf", uploadedAt: "2026-07-12", uploadedBy: "Michael Carter" },
  ],
  c_priya: [
    { kind: "resume", fileName: "paige-sullivan-resume.pdf", uploadedAt: "2026-04-30", uploadedBy: "Paige Sullivan" },
    { kind: "cover_letter", fileName: "paige-cover-base.docx", uploadedAt: "2026-04-30", uploadedBy: "Paige Sullivan" },
    { kind: "doc360", fileName: "paige-360-review.pdf", uploadedAt: "2026-05-08", uploadedBy: "M. Perera" },
    { kind: "cqfo", fileName: "cqfo-paige-sullivan.pdf", uploadedAt: "2026-05-02", uploadedBy: "System" },
  ],
  c_sam: [
    { kind: "resume", fileName: "sam-whitfield-resume.pdf", uploadedAt: "2026-03-15", uploadedBy: "Sam Whitfield" },
  ],
};

// Default weekly quotas per tier (Admin → quotas & tiers). Editable in the UI;
// overrides persist in the localStorage store until the backend.
export const QUOTA_TIERS: QuotaTier[] = [
  { tier: "Tier 1", quota: 12, note: "Priority — highest weekly volume" },
  { tier: "Tier 2", quota: 10, note: "Standard" },
  { tier: "Tier 3", quota: 8, note: "Light touch" },
];

// Audit trail (Admin → audit log).
export const AUDIT_LOG: AuditEntry[] = [
  { id: "a1", at: "2026-07-13 14:22", actor: "M. Perera", action: "Assigned job to N. Jayasuriya", entity: "Notion · Product Designer (Paige Sullivan)" },
  { id: "a2", at: "2026-07-13 13:58", actor: "S. Fernando", action: "Imported 5 jobs", entity: "Ashley Bennett" },
  { id: "a3", at: "2026-07-13 11:40", actor: "Ashley Bennett", action: "Rejected job (location)", entity: "Ramp · Group PM, Payments" },
  { id: "a4", at: "2026-07-13 10:15", actor: "N. Jayasuriya", action: "Marked job blocked", entity: "Vercel · Senior Software Engineer (Devin Cross)" },
  { id: "a5", at: "2026-07-13 09:02", actor: "Ops Admin", action: "Updated weekly quota to 10", entity: "Ashley Bennett" },
  { id: "a6", at: "2026-07-12 17:31", actor: "M. Perera", action: "Reassigned client owner", entity: "Lauren Mitchell → S. Fernando" },
  { id: "a7", at: "2026-07-12 16:04", actor: "System", action: "Weekly quotas reset (ISO week 29)", entity: "All clients" },
];
