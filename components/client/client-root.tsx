"use client";

// Client portal chrome root. Owns the light/dark theme (persisted) and stamps
// data-portal="client" + data-theme so the emerald tokens and the right surface
// colors apply. The portal is light by default with a working dark toggle.

import { ClientGate } from "@/components/client/client-gate";
import { CLIENT_THEME_KEY, useSession, writeSession } from "@/lib/session";

export function ClientRoot({ children }: { children: React.ReactNode }) {
  const theme = useSession(CLIENT_THEME_KEY);
  const dark = theme === "dark";

  return (
    <div
      data-portal="client"
      data-theme={dark ? "dark" : "light"}
      className="min-h-screen bg-background text-foreground"
    >
      <ClientGate
        dark={dark}
        toggleTheme={() =>
          writeSession(CLIENT_THEME_KEY, dark ? "light" : "dark")
        }
      >
        {children}
      </ClientGate>
    </div>
  );
}
