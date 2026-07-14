"use client";

// Guards the internal portal. Signed out → redirect to the sign-in. The
// /admin/login route renders bare (no shell). Auth state comes from the real
// session (RoleProvider probes /auth/me).

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { InternalShell } from "@/components/shell/internal-shell";
import { useStaffSession } from "@/components/shell/role-context";

export function StaffGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status } = useStaffSession();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (status === "signedout" && !isLogin) router.replace("/admin/login");
  }, [status, isLogin, router]);

  // The login page is always reachable, with no shell around it.
  if (isLogin) return <>{children}</>;

  if (status === "loading") return <CenterLoader />;
  if (status === "signedout") return null; // redirecting

  return <InternalShell>{children}</InternalShell>;
}

function CenterLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-muted">
      Loading…
    </div>
  );
}
