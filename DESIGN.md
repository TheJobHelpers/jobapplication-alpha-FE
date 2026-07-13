# JA-Alpha UI Guideline (binding)

Visual reference with screen mockups: https://claude.ai/code/artifact/0762bc55-360e-4dee-b299-866405ad862a
Full UX plan: planning vault `06 Internal Portal UX.md`, `08 Client Portal UX.md`.

Every screen built in this app must follow this file. If a change conflicts with it, update this file first (deliberately), then the code.

## Style

Flat, crisp surfaces. **No glassmorphism, no blur, no gradients, no decorative animation.**
One accent per portal, used only for primary actions, focus, and active states.

| Token | Internal Portal | Client Portal |
|---|---|---|
| Theme | Dark only | Light default + dark toggle |
| Base | `#0B0B0F` | `#FAFAFA` (light) / `#0B0B0F` (dark) |
| Panel | `#121218`, 1px border `#26262F` | `#FFFFFF`, 1px border `#E7E7EC` |
| Accent | Indigo `#6366F1` | Emerald `#10B981` |
| Route prefix | `/admin` | `/client` (public questionnaire: `/q/[token]`) |

Set via `data-portal="internal" | "client"` on the portal layout root; components use `--accent` / `--accent-strong`, never hardcoded accent hexes.

## Status scale (semantic, identical in both portals)

A status never changes color between screens or portals. Separate from the accents.

| Status | Color |
|---|---|
| Client review | `#A78BFA` |
| In progress | `#6366F1` |
| Assigned | `#3B82F6` |
| Applying / Applied | `#06B6D4` |
| Interviewing, "stale" warnings | `#F59E0B` |
| Offer / done / success | `#22C55E` |
| Rejected (by client) | `#F43F5E` |
| Blocked, quota risk | `#EF4444` |
| Expired / closed | `#71717A` |

Chips: pill, 10px semibold, background = status color at ~18% opacity, text = status color.

## Type & spacing

- Page title 15-16px/600 · data body 12.5-13px · reading body 14px · caption 11px muted
- Group labels: 10px/600 uppercase, letter-spacing 0.1em
- Numbers: `tabular-nums`; match scores in mono
- 4px spacing grid · panel padding 16-20px · row gap 8-12px
- Radius: 8px panels/rows, 6px controls, 99px pills. Never mixed within an element class.

## Component rules

1. **Match score meter** — signature element. Small horizontal meter + 2-decimal number, mono, always together, identical everywhere a job appears (both portals).
2. **Urgency stripe** — queue rows carry a 3px left stripe: red = quota/deadline risk, amber = stale, green = ready/positive, blue/violet = informational.
3. **Reasons are first-class** — Rejected and Blocked always render their reason wherever the job appears. A status without its reason is a bug.
4. **Buttons** — primary = portal accent + white text + 600. Secondary = bordered ghost. Reject/destructive = rose outlined, filled only at confirm. One primary per view.
5. **Row actions live on the row** — queue actions are one click, on the row. No kebab menus for primary actions.
6. **One truth, two views** — statuses render from the same state machine in both portals. Internal wording may be technical ("Blocked"), client wording humane ("Action needed"); the state is identical.
7. **Keyboard** — internal: Ctrl+K palette, S = search tray. Questionnaire: Enter advances, A/B/C selects.

## Job workflow states (for UI)

sourced → client_review → approved | rejected(reason: category + text, kept forever)
approved → in_progress → assigned(JA member, by manager) → applying → applied → interviewing → offer/closed
Side states from assigned/applying: expired, blocked(reason).

Client reject categories: location, salary, role_mismatch, seniority, company, already_applied, other.
