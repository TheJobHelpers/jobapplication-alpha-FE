"use client";

// Create a team member — name, email, role, and (for team members) JA/JS
// specialization + client capacity. Role-scoped: the options shown depend on
// the current user (managers can only add team members; admins can add anyone —
// see creatableRoles). Shared by the Team page and Settings so there's one
// create form, not two divergent ones. Mock: writes go to the store, not an API.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { MemberType, Role, TeamMember } from "@/lib/api";
import { creatableRoles, type CurrentUser } from "@/lib/permissions";

const ROLE_LABEL: Record<Role, string> = {
  team_member: "Team member",
  manager: "Manager",
  admin: "Admin",
};

const inputCls =
  "rounded-md border border-panel-border bg-transparent px-2.5 py-1.5 text-[12.5px] outline-none placeholder:text-zinc-600 focus:border-zinc-600";
const selectCls =
  "rounded-md border border-panel-border bg-panel px-2.5 py-1.5 text-[12.5px] text-zinc-200 outline-none focus:border-zinc-600";
const labelCls =
  "text-[10px] font-semibold uppercase tracking-[0.08em] text-muted";

export function MemberForm({
  user,
  onCreate,
  onCancel,
}: {
  user: CurrentUser;
  onCreate: (m: TeamMember) => void;
  onCancel?: () => void;
}) {
  const roles = creatableRoles(user);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>(roles[0] ?? "team_member");
  const [memberType, setMemberType] = useState<MemberType>("ja");
  const [capacity, setCapacity] = useState(8);

  const valid = name.trim() !== "" && email.trim() !== "" && roles.includes(role);

  function submit() {
    if (!valid) return;
    const isTeamMember = role === "team_member";
    onCreate({
      id: `u_new_${Date.now()}`,
      name: name.trim(),
      role,
      memberType: isTeamMember ? memberType : undefined,
      activeClients: 0,
      capacity: isTeamMember ? capacity : 0,
    });
  }

  return (
    <div className="space-y-2.5 rounded-md border border-panel-border p-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name *"
          className={inputCls}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email *"
          type="email"
          className={inputCls}
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <label className="flex flex-col gap-1">
          <span className={labelCls}>Role</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className={selectCls}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABEL[r]}
              </option>
            ))}
          </select>
        </label>

        {role === "team_member" && (
          <>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Specialization</span>
              <select
                value={memberType}
                onChange={(e) => setMemberType(e.target.value as MemberType)}
                className={selectCls}
              >
                <option value="ja">JA — Job Application</option>
                <option value="js">JS — Job Sourcing</option>
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className={labelCls}>Capacity</span>
              <input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value) || 0)}
                className={inputCls}
              />
            </label>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 pt-0.5">
        <Button variant="primary" size="sm" onClick={submit} disabled={!valid}>
          Add member
        </Button>
        {onCancel && (
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}
