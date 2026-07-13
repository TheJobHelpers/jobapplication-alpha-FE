import { ComingSoon } from "@/components/admin/coming-soon";

export default function SettingsPage() {
  return (
    <ComingSoon
      area="Admin"
      title="Settings & audit"
      blurb="Low-frequency, admin-only: team and roles, per-client quotas, enabled job sources, and the audit log. Managers see operations; only admins see this area."
    />
  );
}
