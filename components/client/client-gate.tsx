"use client";

// Guards the client portal. Probes /auth/me: a client principal renders the
// portal for their id; anything else (signed out, or a staff session) → /login.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ClientPortalProvider } from "@/components/client/client-portal-context";
import { ClientShell } from "@/components/client/client-shell";
import { auth, type ClientPrincipal } from "@/lib/api";

export function ClientGate({
  dark,
  toggleTheme,
  children,
}: {
  dark: boolean;
  toggleTheme: () => void;
  children: React.ReactNode;
}) {
  const router = useRouter();
  // undefined = probing, null = not a signed-in client, else the principal.
  const [principal, setPrincipal] = useState<ClientPrincipal | null | undefined>(
    undefined,
  );

  useEffect(() => {
    let alive = true;
    auth.me().then((p) => {
      if (alive) setPrincipal(p && p.kind === "client" ? p : null);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (principal === null) router.replace("/login");
  }, [principal, router]);

  if (principal === undefined) return <CenterLoader />; // probing
  if (principal === null) return null; // redirecting

  return (
    <ClientPortalProvider clientId={principal.id}>
      <ClientShell dark={dark} toggleTheme={toggleTheme}>
        {children}
      </ClientShell>
    </ClientPortalProvider>
  );
}

function CenterLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center text-[13px] text-muted">
      Loading…
    </div>
  );
}
