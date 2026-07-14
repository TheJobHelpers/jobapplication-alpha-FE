"use client";

// Pipeline — cross-client Kanban of every active application. Data is fetched
// client-side so the session cookie is sent (staff-scoped endpoint).

import { useEffect, useState } from "react";
import { PageLoader } from "@/components/admin/page-loader";
import { PipelineBoard } from "@/components/admin/pipeline-board";
import { api, type ApplicationJob } from "@/lib/api";

export default function PipelinePage() {
  const [jobs, setJobs] = useState<ApplicationJob[] | null>(null);
  useEffect(() => {
    api.getJobs().then(setJobs).catch(() => setJobs([]));
  }, []);
  if (!jobs) return <PageLoader />;
  return <PipelineBoard jobs={jobs} />;
}
