import { InternalShell } from "@/components/shell/internal-shell";

// Internal Portal root. Sets the portal accent scope (indigo) via data-portal;
// the shell itself is a client component (keyboard model + active nav).
export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div data-portal="internal">
      <InternalShell>{children}</InternalShell>
    </div>
  );
}
