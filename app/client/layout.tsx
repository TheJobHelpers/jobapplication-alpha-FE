import { ClientRoot } from "@/components/client/client-root";

// Client Portal root. All theming, auth gating, and shell live in ClientRoot
// (a client component) so the layout itself stays a thin server wrapper.
export default function ClientLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <ClientRoot>{children}</ClientRoot>;
}
