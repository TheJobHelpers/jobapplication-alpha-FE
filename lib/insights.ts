// Today overview — role-aware performance insight, computed from the actual data
// (mock fixtures now, the same shapes from the API later). Managers/admins get an
// org-wide read; JA members get their own application performance; JS members get
// sourcing throughput + team outcomes. Kept out of the view so it's testable and
// the numbers are honest — every figure traces to jobs/clients/team.

import type { ApplicationJob, Client, JobStatus, TeamMember } from "@/lib/api";
import { isManagerPlus, type CurrentUser } from "@/lib/permissions";

export type Tone = "default" | "positive" | "warning" | "danger";

export interface StatTile {
  label: string;
  value: string;
  sub?: string;
  meter?: number; // 0..1 — draws a progress bar under the value
  tone?: Tone;
}

export interface FunnelSeg {
  label: string;
  count: number;
  color: string; // CSS var from the status scale
}

export interface Insights {
  title: string;
  subtitle: string;
  tiles: StatTile[];
  funnel?: FunnelSeg[];
  funnelLabel?: string;
  note?: string; // honest caveat when a figure is team-level, not personal
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

// A job at or past "approved" was client-approved (or didn't need approval).
const APPROVED_OR_PAST: Set<JobStatus> = new Set([
  "approved",
  "in_progress",
  "assigned",
  "applying",
  "applied",
  "interviewing",
  "offer",
  "closed",
]);

// Matches the fixture staleness rule (5 days before the fixture "today").
const STALE_BEFORE = "2026-07-09";

const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

// Where each job currently sits, collapsed into a readable left-to-right funnel.
function funnelFrom(jobs: ApplicationJob[]): FunnelSeg[] {
  const has = (...s: JobStatus[]) =>
    jobs.filter((j) => s.includes(j.status)).length;
  return [
    { label: "Sourced", count: has("sourced"), color: "var(--status-sourced)" },
    { label: "In review", count: has("client_review"), color: "var(--status-review)" },
    { label: "Approved", count: has("approved", "in_progress"), color: "var(--status-progress)" },
    { label: "Working", count: has("assigned", "applying", "applied"), color: "var(--status-applied)" },
    { label: "Interviewing", count: has("interviewing"), color: "var(--status-interview)" },
    { label: "Offer", count: has("offer"), color: "var(--status-offer)" },
  ];
}

export function computeInsights(
  user: CurrentUser,
  jobs: ApplicationJob[],
  clients: Client[],
  team: TeamMember[],
): Insights {
  const count = (s: JobStatus) => jobs.filter((j) => j.status === s).length;

  // ── Manager / Admin — operations at a glance ────────────────────────
  if (isManagerPlus(user)) {
    const active = clients.filter((c) => c.stage === "active");
    const filled = active.reduce((s, c) => s + c.filledApps, 0);
    const target = active.reduce((s, c) => s + c.quotaApps, 0);
    const inFlight = jobs.filter((j) => ACTIVE.has(j.status)).length;
    const offers = count("offer");
    const blocked = count("blocked");
    const stale = jobs.filter(
      (j) => ACTIVE.has(j.status) && j.updatedAt <= STALE_BEFORE,
    ).length;
    const members = team.filter((m) => m.role === "team_member");
    const load = members.reduce((s, m) => s + m.activeClients, 0);
    const cap = members.reduce((s, m) => s + m.capacity, 0);

    return {
      title: "Operations at a glance",
      subtitle: `Week's performance across ${active.length} active client${active.length === 1 ? "" : "s"}.`,
      tiles: [
        { label: "Active clients", value: String(active.length), sub: `${clients.length} total` },
        {
          label: "Weekly quota",
          value: `${pct(filled, target)}%`,
          sub: `${filled}/${target} applications`,
          meter: target ? filled / target : 0,
          tone: pct(filled, target) < 60 ? "warning" : "default",
        },
        { label: "In flight", value: String(inFlight), sub: "active applications" },
        { label: "Interviewing", value: String(count("interviewing")), sub: "this week" },
        { label: "Offers", value: String(offers), sub: "live", tone: offers > 0 ? "positive" : "default" },
        {
          label: "Needs attention",
          value: String(blocked + stale),
          sub: `${blocked} blocked · ${stale} stale`,
          tone: blocked + stale > 0 ? "danger" : "default",
        },
        {
          label: "Team load",
          value: `${pct(load, cap)}%`,
          sub: `${load}/${cap} client slots`,
          meter: cap ? load / cap : 0,
        },
      ],
      funnel: funnelFrom(jobs),
      funnelLabel: "Pipeline · where every job sits now",
    };
  }

  // ── JA member — your applications ───────────────────────────────────
  if (user.memberType === "ja") {
    const mine = jobs.filter((j) => j.assignedToId === user.id);
    const myActive = mine.filter((j) => ACTIVE.has(j.status));
    const owned = clients.filter((c) => c.ownerId === user.id);
    const filled = owned.reduce((s, c) => s + c.filledApps, 0);
    const target = owned.reduce((s, c) => s + c.quotaApps, 0);
    const offers = mine.filter((j) => j.status === "offer").length;
    const blocked = mine.filter((j) => j.status === "blocked").length;
    const stale = myActive.filter((j) => j.updatedAt <= STALE_BEFORE).length;

    return {
      title: "Your applications",
      subtitle: `You own ${owned.length} client${owned.length === 1 ? "" : "s"} and ${myActive.length} active application${myActive.length === 1 ? "" : "s"} this week.`,
      tiles: [
        { label: "Active applications", value: String(myActive.length), sub: "assigned to you" },
        { label: "Applied", value: String(mine.filter((j) => j.status === "applied").length), sub: "this week" },
        { label: "Interviewing", value: String(mine.filter((j) => j.status === "interviewing").length) },
        { label: "Offers", value: String(offers), tone: offers > 0 ? "positive" : "default" },
        {
          label: "Your clients' quota",
          value: `${pct(filled, target)}%`,
          sub: `${filled}/${target} applications`,
          meter: target ? filled / target : 0,
          tone: pct(filled, target) < 60 ? "warning" : "default",
        },
        {
          label: "Needs attention",
          value: String(blocked + stale),
          sub: `${blocked} blocked · ${stale} stale`,
          tone: blocked + stale > 0 ? "danger" : "default",
        },
      ],
      funnel: funnelFrom(mine),
      funnelLabel: "Your pipeline",
    };
  }

  // ── JS member — your sourcing ───────────────────────────────────────
  if (user.memberType === "js") {
    const you = team.find((m) => m.id === user.id);
    const sourcedThisWeek = you?.sourcedThisWeek ?? 0;
    const inReview = count("client_review");
    const approvedPast = jobs.filter((j) => APPROVED_OR_PAST.has(j.status)).length;
    const rejected = count("rejected");
    const approvalRate = pct(approvedPast, approvedPast + rejected);

    return {
      title: "Your sourcing",
      subtitle: `You added ${sourcedThisWeek} jobs this week. Here's how the team's sourced jobs are converting.`,
      tiles: [
        { label: "Sourced this week", value: String(sourcedThisWeek), sub: "added by you" },
        { label: "Awaiting review", value: String(inReview), sub: "with clients", tone: inReview > 0 ? "warning" : "default" },
        {
          label: "Approval rate",
          value: `${approvalRate}%`,
          sub: `${approvedPast} approved · ${rejected} rejected`,
          meter: approvedPast + rejected ? approvedPast / (approvedPast + rejected) : 0,
          tone: approvalRate >= 80 ? "positive" : "default",
        },
        { label: "In flight", value: String(jobs.filter((j) => ACTIVE.has(j.status)).length), sub: "team applications" },
      ],
      funnel: funnelFrom(jobs),
      funnelLabel: "Team pipeline · where sourced jobs land",
      note: "Conversion figures are team-level; per-sourcer attribution arrives with the backend.",
    };
  }

  // Fallback (shouldn't happen for staff roles).
  return {
    title: "Today",
    subtitle: "Your overview.",
    tiles: [],
  };
}
