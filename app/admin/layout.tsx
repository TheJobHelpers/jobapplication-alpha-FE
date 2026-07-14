import { StaffGate } from "@/components/auth/staff-gate";
import { RoleProvider } from "@/components/shell/role-context";
import { StoreProvider } from "@/components/shell/store-context";

// Internal Portal root. Sets the portal accent scope (indigo) via data-portal.
// RoleProvider restores the staff session (/auth/me) and supplies the signed-in
// user; StaffGate gates on it + renders the shell; StoreProvider holds records
// created in the UI until the backend owns them.
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-portal="internal">
      <RoleProvider>
        <StoreProvider>
          <StaffGate>{children}</StaffGate>
        </StoreProvider>
      </RoleProvider>
    </div>
  );
}
