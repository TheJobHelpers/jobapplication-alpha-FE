"use client";

// Team — manager/admin oversight. Data is fetched client-side so the session
// cookie is sent; the view gates by the signed-in role.

import { useEffect, useState } from "react";
import { PageLoader } from "@/components/admin/page-loader";
import { TeamView } from "@/components/admin/team-view";
import { api, type TeamWorkload } from "@/lib/api";

export default function TeamPage() {
  const [workload, setWorkload] = useState<TeamWorkload[] | null>(null);
  useEffect(() => {
    api.getTeamWorkload().then(setWorkload).catch(() => setWorkload([]));
  }, []);
  if (!workload) return <PageLoader />;
  return <TeamView workload={workload} />;
}
