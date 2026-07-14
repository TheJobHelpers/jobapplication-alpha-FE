// Real auth against the FastAPI backend. JWT lives in an HttpOnly cookie the
// browser sends automatically (see http.ts); this module only ever deals in
// principals. `me()` is how a session is restored on load / after refresh.

import { apiFetch, ApiError } from "./http";
import type { MemberType, Role } from "./types";

export interface StaffPrincipal {
  kind: "staff";
  id: string;
  name: string;
  email: string;
  role: Role;
  memberType: MemberType | null;
}

export interface ClientPrincipal {
  kind: "client";
  id: string; // the client's id (c_*), not the user row id
  name: string;
  email: string;
}

export type Principal = StaffPrincipal | ClientPrincipal;

export const auth = {
  staffLogin(email: string, password: string): Promise<StaffPrincipal> {
    return apiFetch<StaffPrincipal>("/auth/staff/login", {
      method: "POST",
      body: { email, password },
    });
  },

  clientLogin(email: string, password: string): Promise<ClientPrincipal> {
    return apiFetch<ClientPrincipal>("/auth/client/login", {
      method: "POST",
      body: { email, password },
    });
  },

  logout(): Promise<void> {
    return apiFetch<void>("/auth/logout", { method: "POST" });
  },

  /** Current principal, or null when signed out (401). Other errors bubble. */
  async me(): Promise<Principal | null> {
    try {
      return await apiFetch<Principal>("/auth/me");
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return null;
      throw e;
    }
  },
};
