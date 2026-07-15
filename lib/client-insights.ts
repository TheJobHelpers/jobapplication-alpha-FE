// Client dashboard insights — everything the Client Dashboard shows is derived
// here from the client's own jobs + record, so the page stays declarative and the
// numbers can't drift between the dashboard, My Jobs, and the sidebar meter.
// Mirrors the admin side's lib/insights.ts convention (derive, don't hand-author).

import { STATUS_META, type ApplicationJob, type Client, type JobStatus } from "@/lib/api/types";

// The forward journey a client's roles travel, in plain language. Internal
// statuses fold into a handful of stages the client actually cares about; the
// side outcomes (not-a-fit, closed) live outside the funnel.
const STAGE_DEFS: { key: string; label: string; statuses: JobStatus[] }[] = [
  { key: "in_review", label: "In review", statuses: ["client_review"] },
  {
    key: "in_progress",
    label: "In progress",
    statuses: ["approved", "in_progress", "assigned", "applying"],
  },
  { key: "applied", label: "Applied", statuses: ["applied"] },
  { key: "interviewing", label: "Interviewing", statuses: ["interviewing"] },
  { key: "offer", label: "Offers", statuses: ["offer"] },
];

export interface JourneyStage {
  key: string;
  label: string;
  color: string;
  count: number;
}

export interface WeeklyProgress {
  used: number;
  total: number;
  pct: number; // 0..100
  remaining: number;
  met: boolean;
}

export interface ClientInsights {
  stages: JourneyStage[];
  activeTotal: number; // jobs currently moving through the funnel
  applicationsSent: number; // roles we've actually applied to (applied + beyond)
  interviewing: number;
  offers: number;
  notAFit: number; // declined / rejected — the signal that tunes future matches
  avgMatch: number | null; // 0..100 over active jobs that carry a score
  weekly: WeeklyProgress;
  recent: ApplicationJob[]; // most recently touched, newest first
}

const ACTIVE: Set<JobStatus> = new Set(
  STAGE_DEFS.flatMap((s) => s.statuses),
);

export function computeClientInsights(
  client: Client,
  jobs: ApplicationJob[],
): ClientInsights {
  const countIn = (statuses: JobStatus[]) =>
    jobs.filter((j) => statuses.includes(j.status)).length;

  const stages: JourneyStage[] = STAGE_DEFS.map((s) => ({
    key: s.key,
    label: s.label,
    color: STATUS_META[s.statuses[0]].color,
    count: countIn(s.statuses),
  }));

  const activeTotal = stages.reduce((n, s) => n + s.count, 0);

  const interviewing = countIn(["interviewing"]);
  const offers = countIn(["offer"]);
  // "Applications sent" = roles that have reached the apply step or beyond.
  const applicationsSent =
    countIn(["applied"]) + interviewing + offers + countIn(["closed"]);
  const notAFit = countIn(["rejected"]);

  const scored = jobs.filter(
    (j) => ACTIVE.has(j.status) && typeof j.matchScore === "number",
  );
  const avgMatch = scored.length
    ? Math.round(
        (scored.reduce((sum, j) => sum + (j.matchScore ?? 0), 0) /
          scored.length) *
          100,
      )
    : null;

  const total = client.quotaApps;
  const used = client.filledApps;
  const weekly: WeeklyProgress = {
    used,
    total,
    pct: total ? Math.min(1, used / total) * 100 : 0,
    remaining: Math.max(0, total - used),
    met: total > 0 && used >= total,
  };

  const recent = [...jobs]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, 4);

  return {
    stages,
    activeTotal,
    applicationsSent,
    interviewing,
    offers,
    notAFit,
    avgMatch,
    weekly,
    recent,
  };
}
