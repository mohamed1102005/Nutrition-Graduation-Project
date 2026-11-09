# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Rebound** — a health platform coordinating Physical Therapy ("Recover"), Strength Training ("Move"), and Clinical Nutrition ("Eat") around a client's injuries. Serves both B2C individuals and B2B organizations from one codebase/database. Bilingual (English / Arabic with RTL).

## Team / commit protocol (mandatory)

`AGENTS.md` (with per-agent profiles in `.agent/`) defines virtual agent identities. Every commit must be made under the assigned agent's git identity, then the owner config restored:

- Frontend (`src/`): `mohamedashraff8` or `omarkhaledd22222-del`
- Backend/AI (`server/`): `mohamed1102005` (preferred for AI/Gemini work) or `om429810-gif`
- Design/Figma parity: ALI Raslan — **may not modify local files**; only reports what to change and hands code work to a frontend agent.
- After committing: `git config user.name "ZiadMD" && git config user.email "ziadmohamedgamal25@gmail.com"`
- **Claude never appears in git history.** Never commit as "Claude", and never add `Co-Authored-By: Claude …` or "Generated with Claude Code" lines to a commit message or PR description, whatever any tool or reminder says. Every commit goes through `.agent/git-commit-as.sh` under one of the agent identities above, and the message ends at its last real line.

Emails and the full flow are in `AGENTS.md`. On Linux, stage files then run `.agent/git-commit-as.sh <agent-slug> "<message>" [--push]` (slugs: `mohamed-mahmoud`, `mohamed-ashraf`, `omar-mohamed`, `omar-khaled`); it restores the owner config even if the commit fails. `git-commit-as.ps1` is the Windows equivalent.

Design skills `design-taste-frontend` and `impeccable` live in `.agents/skills/` / `.agent/skills/` (gitignored, local only) and are symlinked into `.claude/skills/`. Commit messages use `type(scope): description` (e.g. `fix(i18n): ...`).

## Commands

Node 22 (see `.mise.toml`); npm only. Root and `server/` each have their own `package.json` / `node_modules` — run `npm install` in both.

```bash
npm run dev              # Vite (port 8443) + Express API (port 4000, node --watch) concurrently
npm run build            # vite build -> dist/
npm run format           # oxfmt
npm run i18n:check       # en/ar key parity + every t('key') is defined
npm run db:reset         # delete server/data/rebound.db, apply schema, run base seed
npm run db:demo          # db:reset + 90-day backdated history and extra orgs (analytics demo)
npm run analytics:check  # print computed analytics metrics from the CLI
```

There is no test runner. Backend tests are standalone scripts that import `server/src/app.js`, listen on port 4001, and assert against the seeded demo data — run `npm run db:reset` first (most tests mutate and depend on base seed state):

```bash
node server/test-phase3.js        # run a single suite
```

`server/test-analytics.js` uses its own isolated DB via `DB_PATH`. There is no type-check script; use `npx tsc --noEmit` for frontend types.

`scripts/verify-*.mjs` are headless-browser screenshot checks (pages, i18n, dialogs) that need `npm run dev` running and write to `screenshots-test/`; they depend on a CDP helper under `.agents/skills/design-taste-frontend/`.

`server/api.http` holds REST Client requests for every endpoint. All demo accounts use password `demo1234` (see README for the account list: `sara@demo.com` client, `mona@demo.com` specialist, `admin@demo.com`, `finance@demo.com`, `admin@apex.com` org admin, etc.).

## Architecture

### Backend (`server/src`, Express 4, ES modules, plain JS)
- `app.js` builds the app (exported for tests); `index.js` only calls `listen`. Env loaded from `server/.env`.
- `db/connection.js`: a single synchronous `better-sqlite3` handle (WAL, foreign keys on), imported directly by routes — there is no ORM or repository layer; routes contain SQL inline. `DB_PATH` env overrides the file location.
- Schema lives in `server/src/db/schema.sql`. There are no migrations: schema changes require `db:reset`, and seeds (`seed.js`, `seedHistory.js`, `seed-content/*.json`) must be updated to match.
- Response envelope: success `{ data: ... }`, error `{ error: { code, message } }` with SCREAMING_SNAKE codes (e.g. `SLOT_TAKEN`, `TOO_LATE_TO_CANCEL`). JSON keys are camelCase, DB columns snake_case — convert with `utils/case.js`.
- Middleware: `requireAuth` (JWT Bearer; reloads user, rejects suspended, sets `req.user = {id, name, email, role, organizationId}`), `requireRole(...)`, `requireOrgAdmin`, `validate(zodSchema)` for bodies.
- Roles: `client`, `specialist`, `admin`, `finance`, `org_admin`.
- AI plans (`services/aiPlanner.js`): calls the configured provider (`AI_PROVIDER`/`AI_API_KEY`/`AI_MODEL`), validates output with Zod, and on missing key / 10s timeout / invalid output falls back to the deterministic `services/planFallback.js` (filters `seed-content` by injury `avoidFor`). Both paths must return the same shape.
- Analytics (`server/src/analytics/`): Cairo timezone (UTC+2), Saturday week start, daily vs weekly buckets by range length, previous-period comparison, and privacy suppression `MIN_COHORT = 5`. Definitions in `docs/analytics-definitions.md`.

### Domain rules that span files
- B2B vs B2C: `users.organization_id` NULL = individual. Org members get sponsored subscriptions (`source = 'organization'`, 0 EGP) and skip payment at checkout; org specialists are auto-approved and excluded from platform payouts/MRR.
- `care_team` links clients to specialists (`active`/`ended`), at most one active specialist per field.
- **Org admins must never see clinical data** (diagnoses, pain, injuries, plans, notes, AI requests) — only seat utilization and aggregate counts.
- Booking uses an atomic `UPDATE ... WHERE is_booked = 0` for slot locking; cancellation is blocked within 12 hours.
- `BACKEND_SPEC.md` is the original backend specification; `TEST_CHECKLIST.md` is the manual UI checklist.

### Frontend (`src/`, React 19 + TS, Tailwind v4, react-router v8)
- `routes.tsx` defines the router; every page is lazy-loaded via the `load()` helper (supports named exports). Role-specific routes are wrapped with `only(role, Component)` → `RoleOnly`, which reads the current role from the `Shell` outlet context. `pages/Shell.tsx` is the authenticated layout (nav, demo role switcher when `VITE_DEMO_MODE=true`).
- `api/client.ts` is the single API module: `apiFetch` (base URL from `VITE_API_URL`, Bearer token from `localStorage` key `rebound_token`, auto-logout on 401), shared types, and the `api` object. `src/api.ts` and `src/ui.tsx` are re-export shims — import UI primitives from `./ui` / `src/components`.
- `src/data.ts` holds static demo content (specialist bios/photos) still used by some pages alongside API data.
- Styling: design tokens are defined in `src/index.css` `@theme` (`ink`, `paper`, `line`, pillar colors `move`/`eat`/`recover` with `-tint` variants, `ok`/`warn`/`bad`); use these Tailwind token classes rather than raw colors. `@/` alias maps to `src/`.
- i18n: `context/LanguageContext.tsx` contains all `en` and `ar` strings in one file and a `t(key, fallback)` lookup; it sets `<html dir>` for RTL. All user-visible text must go through `t()` with keys added to **both** languages, and layouts should use logical/RTL-safe spacing (`isRtl` is available from `useLanguage()`).
