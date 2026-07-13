// Today — the internal home. A role-aware overview (performance insight computed
// from real data, per role) on top of the ordered work queue (06 UX / DESIGN.md).
// Data is fetched server-side; TodayView reads the current (mock) role client-side.

import { TodayView } from "@/components/admin/today-view";
import { api } from "@/lib/api";

export default async function TodayPage() {
  const [jobs, clients, team] = await Promise.all([
    api.getJobs(),
    api.getClients(),
    api.getTeam(),
  ]);

  return <TodayView jobs={jobs} clients={clients} team={team} />;
}
