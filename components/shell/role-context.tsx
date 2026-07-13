"use client";

// Mock "current user" context. Lets you switch role (admin / manager / JA / JS)
// from the shell so the portal's role-aware nav, actions, and Kanban permissions
// are visibly different. Persists the choice in localStorage. Replaced by real
// auth later.

import { createContext, useContext, useEffect, useState } from "react";
import { USER_PRESETS, type CurrentUser } from "@/lib/permissions";

const STORAGE_KEY = "ja:current-user";

type Ctx = { user: CurrentUser; setUser: (u: CurrentUser) => void };

const RoleContext = createContext<Ctx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<CurrentUser>(USER_PRESETS[0]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as CurrentUser;
        const match = USER_PRESETS.find((p) => p.id === saved.id);
        if (match) setUserState(match);
      }
    } catch {
      // ignore corrupt storage
    }
  }, []);

  const setUser = (u: CurrentUser) => {
    setUserState(u);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    } catch {
      // ignore
    }
  };

  return (
    <RoleContext.Provider value={{ user, setUser }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useCurrentUser(): Ctx {
  const ctx = useContext(RoleContext);
  if (!ctx)
    throw new Error("useCurrentUser must be used within <RoleProvider>");
  return ctx;
}
