// Who can do what. There's no auth yet, so the portal runs as a "current user"
// you can switch (see components/shell/role-context). These helpers gate nav,
// actions, and Kanban transitions so each role's view is visibly different.

import type { JobStatus, MemberType, Role } from "@/lib/api";

export interface CurrentUser {
  id: string;
  name: string;
  role: Role;
  memberType?: MemberType;
}

// Presets map to real team members so ownership checks work (S. Fernando owns
// Ashley + Lauren, etc.).
export const USER_PRESETS: CurrentUser[] = [
  { id: "u_admin", name: "Ops Admin", role: "admin" },
  { id: "u_mgr", name: "M. Perera", role: "manager" },
  { id: "u_ja1", name: "S. Fernando", role: "team_member", memberType: "ja" },
  { id: "u_js1", name: "R. Gunawardena", role: "team_member", memberType: "js" },
];

export function roleLabel(u: CurrentUser): string {
  if (u.role === "admin") return "Admin";
  if (u.role === "manager") return "Manager";
  return u.memberType === "js" ? "JS member" : "JA member";
}

export const isAdmin = (u: CurrentUser) => u.role === "admin";
export const isManagerPlus = (u: CurrentUser) =>
  u.role === "admin" || u.role === "manager";

// Nav visibility. Managers see Admin too, but only the quotas slice inside
// (09 Pages nav table: A ✓, M ~).
export const canSeeTeam = isManagerPlus;
export const canSeeAdmin = isManagerPlus;

// Actions
export const canAssign = isManagerPlus; // assign an approved job to a JA member
export const canManageStaff = isAdmin; // full staff admin (settings, quotas, audit)
export const canManageTeamMembers = isManagerPlus; // create team members (Team page)
export const canCreateClient = isManagerPlus; // create + onboard a client

// Which roles a user may create. Only admins can create admins; managers can
// add team members (JA/JS) and other managers, but not admins.
export function creatableRoles(u: CurrentUser): Role[] {
  if (isAdmin(u)) return ["team_member", "manager", "admin"];
  if (u.role === "manager") return ["team_member", "manager"];
  return [];
}
export const canManageStage = isManagerPlus; // change a client's stage
export const canAddJobs = (u: CurrentUser) =>
  isManagerPlus(u) || u.role === "team_member"; // JS mainly, but anyone may add
export const canEditClient = (u: CurrentUser, ownerId: string) =>
  isManagerPlus(u) || u.id === ownerId;

// Kanban / status transitions. Managers+admins can do anything; JA members work
// their assigned jobs; JS members only send sourced jobs to review.
const JA_TARGETS: Set<JobStatus> = new Set([
  "applying",
  "applied",
  "interviewing",
  "offer",
  "expired",
  "blocked",
  "closed",
]);

export function canTransition(
  u: CurrentUser,
  _from: JobStatus,
  to: JobStatus,
): boolean {
  if (isManagerPlus(u)) return true;
  if (u.memberType === "ja") return JA_TARGETS.has(to);
  if (u.memberType === "js") return to === "client_review";
  return false;
}
