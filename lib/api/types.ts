// JA-Alpha domain model — single source of truth for the frontend.
// Mirrors the entities and state machine in the planning vault
// (02 Architecture, 06 Internal Portal UX) and DESIGN.md.
//
// These types shape the mock API today and the FastAPI contract later,
// so the swap from fixtures to real endpoints stays mechanical.

// ── Identity ──────────────────────────────────────────────────────────
export type Role = "admin" | "manager" | "team_member";

// Team-member specialization: JS sources jobs, JA applies to them.
export type MemberType = "ja" | "js";

export interface TeamMember {
  id: string;
  name: string;
  role: Role;
  memberType?: MemberType; // only meaningful for role === "team_member"
  activeClients: number; // current owned-client load
  capacity: number; // max clients before overloaded
}

// ── Clients ───────────────────────────────────────────────────────────
export type ClientStage = "onboarding" | "active" | "paused" | "closed";

export type WorkType = "remote" | "hybrid" | "onsite" | "any";

// Job sources are pluggable adapters on the backend (02 Architecture); the UI
// just needs their id + label for the search panel.
export type JobSource = "indeed" | "linkedin" | "jsearch";

export const JOB_SOURCE_LABEL: Record<JobSource, string> = {
  indeed: "Indeed",
  linkedin: "LinkedIn",
  jsearch: "JSearch",
};

// Distilled from the CQFO questionnaire; powers search pre-fill + match scoring.
export interface ClientPreferences {
  titles: string[];
  locations: string[];
  workType: WorkType;
  salaryMin?: number;
  salaryMax?: number;
  sources: JobSource[]; // sources enabled for this client
}

export interface Client {
  id: string;
  name: string;
  stage: ClientStage;
  tier: string; // e.g. "Tier 2"
  ownerId: string; // exactly one owner (TeamMember id)
  ownerName: string;
  quotaApps: number; // weekly application target
  filledApps: number; // applications assigned so far this week
  approvalRequired: boolean; // client must approve sourced jobs before applying
  preferences?: ClientPreferences;
}

// ── Application jobs & the workflow state machine ─────────────────────
// sourced → client_review → approved | rejected(reason, kept forever)
// approved → in_progress → assigned(JA, by manager) → applying → applied
//          → interviewing → offer | closed
// side states from assigned/applying: expired, blocked(reason)
export type JobStatus =
  | "sourced"
  | "client_review"
  | "approved"
  | "rejected"
  | "in_progress"
  | "assigned"
  | "applying"
  | "applied"
  | "interviewing"
  | "offer"
  | "closed"
  | "expired"
  | "blocked";

// A rejection is never a dead end — the category is the signal (06 UX).
export type RejectCategory =
  | "location"
  | "salary"
  | "role_mismatch"
  | "seniority"
  | "company"
  | "already_applied"
  | "other";

export interface ApplicationJob {
  id: string;
  clientId: string;
  clientName: string;
  company: string;
  title: string;
  location: string;
  salary?: string;
  matchScore: number; // 0..1, the signature metric
  status: JobStatus;
  assignedToId?: string;
  assignedToName?: string;
  // Reasons are first-class: rejected + blocked always carry one (DESIGN.md).
  rejectCategory?: RejectCategory;
  reason?: string;
  postedAt?: string; // ISO date
  updatedAt: string; // ISO date
}

// ── Status metadata — one truth, two views ───────────────────────────
// `color` is a CSS custom property reference so components never hardcode
// hexes; `clientLabel` is the humane wording shown in the Client Portal.
export interface StatusMeta {
  label: string;
  clientLabel: string;
  color: string; // e.g. "var(--status-review)"
}

export const STATUS_META: Record<JobStatus, StatusMeta> = {
  sourced: {
    label: "Sourced",
    clientLabel: "Sourced",
    color: "var(--status-sourced)",
  },
  client_review: {
    label: "Client review",
    clientLabel: "Needs your review",
    color: "var(--status-review)",
  },
  approved: {
    label: "Approved",
    clientLabel: "Approved",
    color: "var(--status-offer)",
  },
  rejected: {
    label: "Rejected",
    clientLabel: "Not a fit",
    color: "var(--status-rejected)",
  },
  in_progress: {
    label: "In progress",
    clientLabel: "In progress",
    color: "var(--status-progress)",
  },
  assigned: {
    label: "Assigned",
    clientLabel: "In progress",
    color: "var(--status-assigned)",
  },
  applying: {
    label: "Applying",
    clientLabel: "Applying",
    color: "var(--status-applied)",
  },
  applied: {
    label: "Applied",
    clientLabel: "Applied",
    color: "var(--status-applied)",
  },
  interviewing: {
    label: "Interviewing",
    clientLabel: "Interviewing",
    color: "var(--status-interview)",
  },
  offer: {
    label: "Offer",
    clientLabel: "Offer",
    color: "var(--status-offer)",
  },
  closed: {
    label: "Closed",
    clientLabel: "Closed",
    color: "var(--status-expired)",
  },
  expired: {
    label: "Expired",
    clientLabel: "No longer available",
    color: "var(--status-expired)",
  },
  blocked: {
    label: "Blocked",
    clientLabel: "Action needed",
    color: "var(--status-blocked)",
  },
};

export const REJECT_CATEGORY_LABEL: Record<RejectCategory, string> = {
  location: "Location / too far",
  salary: "Salary too low",
  role_mismatch: "Role mismatch",
  seniority: "Seniority mismatch",
  company: "Company concern",
  already_applied: "Already applied",
  other: "Other",
};

// ── Today work queue ──────────────────────────────────────────────────
// The internal home is a work queue, not a stats dashboard (06 UX).
export type Urgency = "danger" | "warning" | "positive" | "info";

export type TodayKind =
  | "quota" // client below weekly quota
  | "status_update" // applications needing a status refresh
  | "search_done" // a finished background search
  | "intake" // new client / questionnaire milestone
  | "blocked"; // a blocked job needing manager/client input

export interface TodayItem {
  id: string;
  kind: TodayKind;
  urgency: Urgency; // drives the row's left urgency stripe
  title: string;
  detail: string;
  meta?: string; // right-aligned context, e.g. "Week ends in 2 days"
  clientId?: string;
  action?: { label: string; href?: string };
}
