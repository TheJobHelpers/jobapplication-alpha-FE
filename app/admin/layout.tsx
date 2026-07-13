import { StaffGate } from "@/components/auth/staff-gate";
import { RoleProvider } from "@/components/shell/role-context";
import { StoreProvider } from "@/components/shell/store-context";

// Internal Portal root. Sets the portal accent scope (indigo) via data-portal.
// StaffGate handles the mock sign-in gate + shell; RoleProvider supplies the mock
// "current user"; StoreProvider holds records created in the UI until the backend.
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
