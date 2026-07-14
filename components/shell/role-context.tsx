"use client";

// Staff session, backed by real auth (/auth/me). The signed-in user's role is
// whatever they logged in as — it drives all role-aware nav, actions, and Kanban
// permissions. (There is no "viewing as" switcher anymore; to see another role's
// view, sign in as an account with that role.)
//
// useCurrentUser() returns the signed-in staff user and is safe to read anywhere
// inside the gated shell (the StaffGate guarantees an authed user before the
// shell renders). useStaffSession() exposes the loading/signed-out status and the
// sign-out control for the gate + shell chrome.

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { auth, type Principal } from "@/lib/api";
import type { CurrentUser } from "@/lib/permissions";

type Status = "loading" | "authed" | "signedout";

interface Ctx {
  user: CurrentUser | null; // null unless status === "authed"
  status: Status;
  refresh: () => Promise<void>; // re-probe /auth/me (after login)
  signOut: () => Promise<void>;
}

const RoleContext = createContext<Ctx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const applyPrincipal = useCallback((principal: Principal | null) => {
    if (principal && principal.kind === "staff") {
      setUser({
        id: principal.id,
        name: principal.name,
        role: principal.role,
        memberType: principal.memberType ?? undefined,
      });
      setStatus("authed");
    } else {
      setUser(null);
      setStatus("signedout");
    }
  }, []);

  const refresh = useCallback(async () => {
    applyPrincipal(await auth.me());
  }, [applyPrincipal]);

  // Restore the session on load. The setState happens in the promise callback
  // (external-state → React), not synchronously in the effect body.
  useEffect(() => {
    let alive = true;
    auth.me().then((principal) => {
      if (alive) applyPrincipal(principal);
    });
    return () => {
      alive = false;
    };
  }, [applyPrincipal]);

  const signOut = useCallback(async () => {
    try {
      await auth.logout();
    } finally {
      setUser(null);
      setStatus("signedout");
    }
  }, []);

  return (
    <RoleContext.Provider value={{ user, status, refresh, signOut }}>
      {children}
    </RoleContext.Provider>
  );
}

// The signed-in staff user. Only valid inside the gated shell — throws if read
// while signed out, which would be a routing bug (the gate should have blocked).
export function useCurrentUser(): { user: CurrentUser } {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useCurrentUser must be used within <RoleProvider>");
  if (!ctx.user) throw new Error("useCurrentUser read while signed out");
  return { user: ctx.user };
}

// Full session state + controls, for the gate and shell chrome.
export function useStaffSession(): Ctx {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error("useStaffSession must be used within <RoleProvider>");
  return ctx;
}
