"use client";

// Mock session store. No backend yet, so "who's signed in" lives in localStorage.
// Read through useSession (useSyncExternalStore) so there's no setState-in-effect
// and no hydration mismatch: the server snapshot is `undefined` ("not yet known"),
// which lets gates show a loader instead of flashing a wrong redirect. Replaced by
// real auth (JWT HttpOnly cookies) when the backend lands.

import { useSyncExternalStore } from "react";

export const STAFF_SESSION_KEY = "ja:staff-session";
export const CLIENT_SESSION_KEY = "ja:client-session"; // value = signed-in client id
export const CLIENT_DECISIONS_KEY = "ja:client-decisions"; // approve/reject per job
export const CLIENT_THEME_KEY = "ja:client-theme"; // "light" | "dark"
export const CLIENT_JOBS_VIEW_KEY = "ja:client-jobs-view"; // "board" | "list"

const CHANGE_EVENT = "ja:session-change";

function subscribe(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", cb); // cross-tab
  window.addEventListener(CHANGE_EVENT, cb); // same-tab writes
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

export function readSession(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key: string, value: string | null): void {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // ignore storage failures (private mode, etc.)
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHANGE_EVENT));
}

// Returns `undefined` until hydrated, then `string | null`. Distinguishing
// "loading" (undefined) from "signed out" (null) is what prevents redirect flashes.
export function useSession(key: string): string | null | undefined {
  return useSyncExternalStore(
    subscribe,
    () => readSession(key),
    () => undefined,
  );
}
