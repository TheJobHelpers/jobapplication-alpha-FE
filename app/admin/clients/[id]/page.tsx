import { notFound } from "next/navigation";
import { ClientWorkspace } from "@/components/admin/client-workspace";
import { api } from "@/lib/api";

// Client Workspace route. Server-fetches the client + their jobs, then hands off
// to the interactive workspace. Reached from Today items and the Clients roster.
export default async function ClientWorkspacePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const client = await api.getClient(id);
  if (!client) notFound();

  const jobs = await api.getJobsForClient(id);
  return <ClientWorkspace client={client} initialJobs={jobs} />;
}
