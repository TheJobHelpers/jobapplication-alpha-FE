import { TeamView } from "@/components/admin/team-view";
import { api } from "@/lib/api";

// Team — manager/admin oversight. Data fetched server-side; the view gates by
// the current (mock) role.
export default async function TeamPage() {
  const workload = await api.getTeamWorkload();
  return <TeamView workload={workload} />;
}
