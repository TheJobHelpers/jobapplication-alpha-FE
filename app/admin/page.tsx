"use client";

// Today — the internal home. A role-aware overview (performance insight computed
// from real data, per role) on top of the ordered work queue (06 UX / DESIGN.md).
// Data is fetched client-side (cookie-scoped); TodayView reads the signed-in role.

import { useEffect, useState } from "react";
import { PageLoader } from "@/components/admin/page-loader";
import { TodayView } from "@/components/admin/today-view";
import { api, type ApplicationJob, type Client, type TeamMember } from "@/lib/api";

export default function TodayPage() {
  const [data, setData] = useState<{
    jobs: ApplicationJob[];
    clients: Client[];
    team: TeamMember[];
  } | null>(null);

  useEffect(() => {
    Promise.all([api.getJobs(), api.getClients(), api.getTeam()])
      .then(([jobs, clients, team]) => setData({ jobs, clients, team }))
      .catch(() => setData({ jobs: [], clients: [], team: [] }));
  }, []);

  if (!data) return <PageLoader />;
  return <TodayView jobs={data.jobs} clients={data.clients} team={data.team} />;
}
