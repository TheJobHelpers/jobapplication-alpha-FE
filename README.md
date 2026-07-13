# jobapplication-alpha-FE

Frontend for **JA-Alpha** — the multi-portal job application management platform.
Next.js 16 (App Router) · React 19 · TypeScript 5 · Tailwind CSS 4.

Two portals share this app:

- **Internal Portal** (`/admin`) — ops console for the JA team: work queue, client
  workspaces, pipeline, team oversight. Indigo accent, dark only.
- **Client Portal** (`/client`) — clients review sourced jobs and track applications.
  Emerald accent, light default with dark toggle.
- **Public questionnaire** (`/q/[token]`) — Typeform-style CQFO intake, no login.

The binding UI guideline lives in [`DESIGN.md`](./DESIGN.md) — every screen follows it.

## Getting started

```bash
npm install
npm run dev        # http://localhost:3000
```

Other scripts: `npm run build`, `npm run start`, `npm run lint`.

## Structure

```
app/            # routes (App Router)
  admin/        # Internal Portal
  q/[token]/    # public CQFO questionnaire
components/
  ui/           # signature primitives (StatusChip, MatchScore, Button, Panel)
  shell/        # portal shells
lib/
  api/          # typed domain model + mock API layer (the future API contract)
```

## Backend

Development is frontend-first: screens run on the mock data in `lib/api/`, which
defines the API contract the backend implements. Swapping fixtures for real calls
touches only `lib/api/`. Backend repo: **jobapplication-alpha-BE**.
