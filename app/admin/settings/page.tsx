import { SettingsView } from "@/components/admin/settings-view";
import { api } from "@/lib/api";

// Admin — settings & audit. Admin-only; the view gates by the current role.
export default async function SettingsPage() {
  const [team, audit] = await Promise.all([api.getTeam(), api.getAuditLog()]);
  return <SettingsView team={team} audit={audit} />;
}
