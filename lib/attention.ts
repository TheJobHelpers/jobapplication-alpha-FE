// "Needs attention" — derived from the actual data (jobs + clients), not a static
// list, so it scales: at 30 clients it stays a tracked, categorized, role-scoped
// triage instead of a wall of rows. The view groups by category (counts as
// filters), scopes to the current role, sorts by urgency, and caps what's shown.

import type { ApplicationJob, Client, JobStatus } from "@/lib/api";
import { isManagerPlus, type CurrentUser } from "@/lib/permissions";

export type AttentionCategory =
  | "quota"
  | "blocked"
  | "stale"
  | "review"
  | "assign"
  | "intake"
  | "triage";

export type AttentionUrgency = "danger" | "warning" | "info";

export interface AttentionItem {
  id: string;
  category: AttentionCategory;
  urgency: AttentionUrgency;
  title: string;
  detail: string;
  meta?: string;
  clientId?: string;
  ownerId?: string; // owning team member — used for role scoping
  action?: { label: string; href?: string };
}

export const CATEGORY_META: Record<
  AttentionCategory,
  { label: string; color: string }
> = {
  quota: { label: "Quota", color: "var(--status-rejected)" },
  blocked: { label: "Blocked", color: "var(--status-blocked)" },
  stale: { label: "Stale", color: "var(--status-interview)" },
  review: { label: "Review", color: "var(--status-review)" },
  assign: { label: "Assign", color: "var(--status-progress)" },
  intake: { label: "Intake", color: "var(--status-assigned)" },
  triage: { label: "Triage", color: "var(--status-sourced)" },
};

export const URGENCY_RANK: Record<AttentionUrgency, number> = {
  danger: 0,
  warning: 1,
  info: 2,
};

const ACTIVE: Set<JobStatus> = new Set([
  "in_progress",
  "assigned",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "blocked",
]);
const STALE_BEFORE = "2026-07-09";

function groupByClient(jobs: ApplicationJob[]): Map<string, ApplicationJob[]> {
  const m = new Map<string, ApplicationJob[]>();
  for (const j of jobs) {
    const arr = m.get(j.clientId);
    if (arr) arr.push(j);
    else m.set(j.clientId, [j]);
  }
  return m;
}

const plural = (n: number, one: string, many = one + "s") => (n === 1 ? one : many);

export function deriveAttention(
  jobs: ApplicationJob[],
  clients: Client[],
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const clientById = new Map(clients.map((c) => [c.id, c]));

  // Quota risk — active client under its weekly application target.
  for (const c of clients.filter((c) => c.stage === "active")) {
    if (c.filledApps < c.quotaApps) {
      const gap = c.quotaApps - c.filledApps;
      items.push({
        id: `quota_${c.id}`,
        category: "quota",
        urgency: gap >= 4 ? "danger" : gap >= 2 ? "warning" : "info",
        title: `${c.name} is ${gap} ${plural(gap, "job")} short of quota`,
        detail: `${c.filledApps} / ${c.quotaApps} applications this week`,
        meta: "Week ends in 2 days",
        clientId: c.id,
        ownerId: c.ownerId,
        action: { label: "Open workspace", href: `/admin/clients/${c.id}` },
      });
    }
  }

  // Blocked — one per job, reason always shown (reasons are first-class).
  for (const j of jobs.filter((j) => j.status === "blocked")) {
    items.push({
      id: `blocked_${j.id}`,
      category: "blocked",
      urgency: "danger",
      title: `Blocked: ${j.title} at ${j.company}`,
      detail: `${j.reason ?? "Needs input"} · ${j.clientName}`,
      clientId: j.clientId,
      ownerId: j.assignedToId,
      action: { label: "Resolve", href: `/admin/clients/${j.clientId}` },
    });
  }

  // Stale — active jobs untouched 5+ days, grouped per client.
  const stale = jobs.filter(
    (j) => ACTIVE.has(j.status) && j.updatedAt <= STALE_BEFORE,
  );
  for (const [cid, js] of groupByClient(stale)) {
    items.push({
      id: `stale_${cid}`,
      category: "stale",
      urgency: "warning",
      title: `${js.length} ${plural(js.length, "application")} haven't moved in 5+ days`,
      detail: js[0].clientName,
      clientId: cid,
      ownerId: js[0].assignedToId ?? clientById.get(cid)?.ownerId,
      action: { label: "Open pipeline", href: "/admin/pipeline" },
    });
  }

  // Review wait — jobs sitting with the client, grouped per client.
  for (const [cid, js] of groupByClient(
    jobs.filter((j) => j.status === "client_review"),
  )) {
    const c = clientById.get(cid);
    items.push({
      id: `review_${cid}`,
      category: "review",
      urgency: "info",
      title: `${js.length} ${plural(js.length, "job")} awaiting ${js[0].clientName}'s review`,
      detail: "Nudge the client or follow up",
      clientId: cid,
      ownerId: c?.ownerId,
      action: { label: "Open workspace", href: `/admin/clients/${cid}` },
    });
  }

  // Assign — approved / in-progress jobs with no JA yet (manager action).
  for (const [cid, js] of groupByClient(
    jobs.filter(
      (j) =>
        (j.status === "approved" || j.status === "in_progress") &&
        !j.assignedToId,
    ),
  )) {
    const c = clientById.get(cid);
    items.push({
      id: `assign_${cid}`,
      category: "assign",
      urgency: "warning",
      title: `${js.length} approved ${plural(js.length, "job")} ${js.length === 1 ? "needs" : "need"} a JA assignment`,
      detail: js[0].clientName,
      clientId: cid,
      ownerId: c?.ownerId,
      action: { label: "Assign", href: `/admin/clients/${cid}` },
    });
  }

  // Intake — clients still onboarding.
  for (const c of clients.filter((c) => c.stage === "onboarding")) {
    items.push({
      id: `intake_${c.id}`,
      category: "intake",
      urgency: "info",
      title: `Finish onboarding for ${c.name}`,
      detail: "Questionnaire and preferences to complete",
      clientId: c.id,
      ownerId: c.ownerId,
      action: { label: "Open workspace", href: `/admin/clients/${c.id}` },
    });
  }

  // Triage — freshly sourced jobs waiting to be sent to review, per client.
  for (const [cid, js] of groupByClient(
    jobs.filter((j) => j.status === "sourced"),
  )) {
    const c = clientById.get(cid);
    items.push({
      id: `triage_${cid}`,
      category: "triage",
      urgency: "info",
      title: `${js.length} new ${plural(js.length, "job")} for ${js[0].clientName}`,
      detail: "Fresh from sourcing. Send the good ones to review",
      clientId: cid,
      ownerId: c?.ownerId,
      action: { label: "Triage shortlist", href: `/admin/clients/${cid}` },
    });
  }

  return items;
}

// Role scoping: JA members see their own clients' issues (not manager-only
// "assign"); JS members see sourcing-relevant work; managers/admins see all.
export function scopeAttention(
  items: AttentionItem[],
  user: CurrentUser,
): AttentionItem[] {
  if (isManagerPlus(user)) return items;
  if (user.memberType === "ja")
    return items.filter((i) => i.ownerId === user.id && i.category !== "assign");
  if (user.memberType === "js")
    return items.filter((i) =>
      ["quota", "triage", "review"].includes(i.category),
    );
  return items;
}

export function countByCategory(
  items: AttentionItem[],
): Partial<Record<AttentionCategory, number>> {
  const out: Partial<Record<AttentionCategory, number>> = {};
  for (const i of items) out[i.category] = (out[i.category] ?? 0) + 1;
  return out;
}
