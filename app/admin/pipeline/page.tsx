import { PipelineBoard } from "@/components/admin/pipeline-board";
import { api } from "@/lib/api";

// Pipeline — cross-client Kanban of every active application.
export default async function PipelinePage() {
  const jobs = await api.getJobs();
  return <PipelineBoard jobs={jobs} />;
}
