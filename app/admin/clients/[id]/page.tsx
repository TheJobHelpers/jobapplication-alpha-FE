import { ClientWorkspaceLoader } from "@/components/admin/client-workspace-loader";

// Client Workspace route. Resolves via the local store (UI-created clients) then
// fixtures on the client, so newly-onboarded clients open too.
export default function ClientWorkspacePage() {
  return <ClientWorkspaceLoader />;
}
