"use client";

// Guards the internal portal. Signed out → redirect to the mock sign-in.
// The /admin/login route renders bare (no shell). Mock until real auth lands.

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { InternalShell } from "@/components/shell/internal-shell";
import { STAFF_SESSION_KEY, useSession } from "@/lib/session";

export function StaffGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useSession(STAFF_SESSION_KEY);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (session === null && !isLogin) router.replace("/admin/login");
  }, [session, isLogin, router]);

  // The login page is always reachable, with no shell around it.
  if (isLogin) return <>{children}</>;

  if (session === undefined) return <CenterLoader />; // hydrating
  if (session === null) return null; // redirecting

  return <InternalShell>{children}</InternalShell>;
}

function CenterLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-muted">
      Loading…
    </div>
  );
}
