import { SettingsView } from "@/components/admin/settings-view";
import { api } from "@/lib/api";

// Admin — settings & audit. Admins get everything; managers the quotas slice.
export default async function SettingsPage() {
  const [team, audit, tiers] = await Promise.all([
    api.getTeam(),
    api.getAuditLog(),
    api.getQuotaTiers(),
  ]);
  return <SettingsView team={team} audit={audit} tiers={tiers} />;
}
