"use client";

// Mock staff sign-in. No real auth yet — any input signs you in and drops you at
// Today. Replaced by a real login (email/password → JWT cookie) with the backend.

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";
import { STAFF_SESSION_KEY, writeSession } from "@/lib/session";

export default function StaffLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("ops@thejobhelpers.com");
  const [password, setPassword] = useState("demo");

  function signIn(e: React.FormEvent) {
    e.preventDefault();
    writeSession(STAFF_SESSION_KEY, "1");
    router.replace("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-6">
          <Logo size={34} subtitle="Operations Console" />
        </div>

        <form
          onSubmit={signIn}
          className="space-y-3 rounded-lg border border-panel-border bg-panel p-5"
        >
          <div>
            <h1 className="text-[15px] font-semibold">Sign in</h1>
            <p className="mt-1 text-[12.5px] text-muted">
              Staff access to the internal portal.
            </p>
          </div>

          <label className="block">
            <span className="text-[11px] font-medium text-muted">Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-600"
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-medium text-muted">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-panel-border bg-transparent px-3 py-2 text-[13px] outline-none focus:border-zinc-600"
            />
          </label>

          <Button variant="primary" size="md" type="submit" className="w-full">
            Sign in
          </Button>

          <p className="text-center text-[11px] text-zinc-500">
            Mock sign-in. Any credentials work until the backend is ready.
          </p>
        </form>
      </div>
    </div>
  );
}
