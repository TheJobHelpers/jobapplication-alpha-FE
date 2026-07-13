"use client";

// Guards the client portal. Signed out → redirect to /login. Once a client id is
// in session, load their data and render the shell.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ClientPortalProvider } from "@/components/client/client-portal-context";
import { ClientShell } from "@/components/client/client-shell";
import { CLIENT_SESSION_KEY, useSession } from "@/lib/session";

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
  const clientId = useSession(CLIENT_SESSION_KEY);

  useEffect(() => {
    if (clientId === null) router.replace("/login");
  }, [clientId, router]);

  if (clientId === undefined) return <CenterLoader />; // hydrating
  if (clientId === null) return null; // redirecting

  return (
    <ClientPortalProvider clientId={clientId}>
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
