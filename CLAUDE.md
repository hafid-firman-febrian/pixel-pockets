# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

App:

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, extends `eslint-config-next`)

Database (Drizzle Kit, Neon Postgres):

- `npm run db:generate` — generate a SQL migration from `db/schema.ts` into `db/migrations/`
- `npm run db:migrate` — apply pending migrations (runs [db/migrate.ts](db/migrate.ts))
- `npm run db:push` — push schema directly without generating a migration (dev only)
- `npm run db:studio` — open Drizzle Studio
- `npm run db:seed` — seed dummy data; pass `--force` to wipe + reseed (see [db/seed.ts](db/seed.ts))

Data ops (`tsx scripts/*`):

- `npm run db:import` — bulk import transactions from `data/transactions-import.csv`
- `npm run db:restore` — restore from a JSON backup in `data/backups/`
- `npm run sheet:resync` — wipe + rebuild the linked Google Sheet from current DB rows
- `npm run auth:hash-pin` — generate a `PIN_HASH` value to put in `.env.local`

There is no test runner configured.

## Stack versions

- Next.js **16.2.3**, React **19.2.4**, TypeScript 5, Tailwind CSS **v4** (via `@tailwindcss/postcss`), Recharts 3.
- Database: Neon serverless Postgres (`@neondatabase/serverless`) accessed via Drizzle ORM `0.45.x` and Drizzle Kit `0.31.x`. Schema lives in [db/schema.ts](db/schema.ts); migrations in [db/migrations/](db/migrations/).
- Google Sheets sync: `@googleapis/sheets` + `google-auth-library` (service-account JWT).
- Tailwind v4 is configured entirely in [app/globals.css](app/globals.css) via `@import "tailwindcss"` and `@theme inline` — there is no `tailwind.config.*` file. Theme tokens (`--color-*`, `--font-*`) are declared in CSS.
- Per [AGENTS.md](AGENTS.md): Next.js 16 has breaking changes vs. older training data. When unsure about an API, check `node_modules/next/dist/docs/` before coding. Notable: middleware is now [proxy.ts](proxy.ts) at the project root, server actions use the new `after()` from `next/server`, and `useLinkStatus()` is imported from `next/link`.

## Required environment (`.env.local`)

- `DATABASE_URL` — Neon Postgres connection string (required for app, scripts, and `drizzle.config.ts`).
- `PIN_HASH` — scrypt hash produced by `npm run auth:hash-pin`. Without it, login fails closed.
- `SESSION_SECRET` — at least 32 chars; used to HMAC-sign session cookies.
- `GOOGLE_SHEETS_CREDENTIALS`, `GOOGLE_SHEETS_ID`, optional `GOOGLE_SHEETS_TAB_NAME` — service-account JSON (base64-encoded) + spreadsheet ID. If unset, sheet sync is silently skipped (see `isSheetSyncConfigured` in [lib/server/sheets.ts](lib/server/sheets.ts)).

## Architecture

Single-user personal finance tracker ("Pixel-Pockets") with a Postgres backend and PIN-gated access. Transactions persist in Neon; the dashboard reads them server-side and mutations flow through server actions. Optional Google Sheets mirror.

### Auth & routing

- **[proxy.ts](proxy.ts)** is the Next.js 16 proxy (formerly `middleware.ts`). It guards `/`, `/home/*`, `/input/*` by verifying the `pp_session` cookie via `verifySessionToken`; on miss it redirects to `/login?next=…`.
- **[lib/auth/session.ts](lib/auth/session.ts)** issues HMAC-signed session tokens (`base64url(payload).signature`, 7-day TTL). **[lib/auth/pin.ts](lib/auth/pin.ts)** hashes/verifies PINs with scrypt.
- **[app/login/page.tsx](app/login/page.tsx)** + **[app/login/LoginForm.tsx](app/login/LoginForm.tsx)** call **[app/actions/auth.ts](app/actions/auth.ts)** (`loginAction`, `logoutAction`).

App Router pages:

- [app/page.tsx](app/page.tsx) redirects `/` → `/home`.
- [app/home/page.tsx](app/home/page.tsx) is an **async server component** that calls `listTransactions()` from [lib/server/transactions.repo.ts](lib/server/transactions.repo.ts) and passes the result to `<HomeDashboard>`. Uses `export const dynamic = "force-dynamic"` so external DB writes (e.g., direct sheet edits or scripts) show up on reload.
- [app/input/page.tsx](app/input/page.tsx) renders the entry form.
- [app/layout.tsx](app/layout.tsx) wraps everything in `AppProviders` and loads the Inconsolata font via `next/font/google`, exposing it as the `--font-inconsolata` CSS variable used by Tailwind's `font-mono`/`font-sans` tokens.

### Data layer (server-only)

- **[db/schema.ts](db/schema.ts)** — single `transactions` table (`id` serial PK, `type`, `amount` integer IDR, `category`, `description`, `transaction_date` date, `created_at` timestamp).
- **[db/client.ts](db/client.ts)** — `db` instance (`drizzle(neon(DATABASE_URL))`). Marked `"server-only"`; never import from a client component.
- **[lib/server/transactions.repo.ts](lib/server/transactions.repo.ts)** — typed CRUD wrappers (`listTransactions`, `getTransactionById`, `createTransaction`, `updateTransaction`, `deleteTransaction`). Maps DB rows to the shared `TransactionRecord` shape so client code stays oblivious to Drizzle.
- **[lib/server/sheets.ts](lib/server/sheets.ts)** — Google Sheets mirror. Public ops: `appendRow`, `updateRow`, `deleteRow`, `resync`. All quietly no-op if `isSheetSyncConfigured()` is false.

### Mutations & state

Mutations are **server actions**, not in-memory React state.

- **[app/actions/transactions.ts](app/actions/transactions.ts)** exposes `addTransactionAction`, `updateTransactionAction`, `deleteTransactionAction`. Each one:
  1. Calls the repo (`createTransaction`, etc.).
  2. `revalidatePath("/home")` + `revalidatePath("/input")`.
  3. Schedules a sheet-sync via `after()` from `next/server` (fire-and-forget; failures are logged, never thrown to the user).
     Form values are normalized through `resolveTransactionCategory` so `categoryOption` + `customCategory` collapse into a single stored `category` string.
- **[hooks/useTransactionActions.ts](hooks/useTransactionActions.ts)** is the client-side wrapper hook. It calls the server actions, surfaces success/failure via `useToast()`, and is what UI components should import. **Do not call server actions directly from components** — go through this hook to keep toast UX consistent.

Providers (in [components/providers/](components/providers/), composed by [AppProviders.tsx](components/providers/AppProviders.tsx)):

- **`NavigationStatusProvider`** — counts in-flight `<Link>` navigations; **`NavigationProgressBar`** ([components/nav/](components/nav/)) renders the yellow top-of-page bar by reading this; **`NavigationLinkReporter`** is dropped inside each `<Link>` to call `useLinkStatus()` and increment/decrement.
- **`ToastProvider`** — fixed bottom-right toast stack; `useToast().showToast(message)` from anywhere in the tree.
- There is **no `TransactionProvider`** anymore. The dashboard receives transactions as a prop from the server component; mutations re-render via `revalidatePath`.

### Domain modules in `lib/`

Pure functions — no React, no I/O. Keep new business logic here.

- **[lib/transactions.ts](lib/transactions.ts)** — `TransactionRecord` type, the `TRANSACTION_CATEGORIES` preset list, and `dummyTransactions` (used only by `db:seed`, not at runtime). Amounts are IDR integers (no decimals).
- **[lib/transaction-form.ts](lib/transaction-form.ts)** — form-layer types and helpers. The form model (`TransactionFormValues`) differs from the stored model: it carries `categoryOption` + `customCategory` separately, with the sentinel `CUSTOM_CATEGORY_OPTION = "__custom__"` meaning "use the free-text field." Use `mapTransactionToFormValues` / `resolveTransactionCategory` to convert between the two representations — do not duplicate this logic in components.
- **[lib/dashboard.ts](lib/dashboard.ts)** — date-range filtering (`DashboardFilter` = all/week/month/salaryPeriod/year, with `salaryPeriod` being the dashboard default; `TransactionListFilter` = all/week/month/year + a sliding `offset` for prev/next period navigation), aggregation (`buildSummary`, `buildTrendData`, `buildCategoryData`, `groupTransactionsByDay`), and formatters. Salary period runs from the 27th of one month to the 26th of the next (`SALARY_PAYDAY = 27`); `formatSalaryPeriodRange` renders the active range. Currency uses `id-ID` IDR; dates are stored as `YYYY-MM-DD` strings and parsed with `parseDateOnly` (local-noon to avoid timezone drift).

### Scripts (`scripts/`, run with `tsx`)

- **[import-transactions.ts](scripts/import-transactions.ts)** — bulk-load `data/transactions-import.csv` (uses `csv-parse`).
- **[restore-transactions.ts](scripts/restore-transactions.ts)** — restore from a JSON backup file under `data/backups/`.
- **[resync-sheet.ts](scripts/resync-sheet.ts)** — call `sheets.resync(records)` to fully rebuild the linked tab.
- **[hash-pin.ts](scripts/hash-pin.ts)** — interactive helper that prints a `PIN_HASH` value.

### UI conventions

- Visual style is a "terminal / pixel" aesthetic: black 1px borders, yellow-300 highlights, hard `shadow-[Npx_Npx_0_0_#000]` drop shadows, uppercase `tracking-[0.3em]` micro-labels prefixed with `/`. Match this when adding UI.
- The body in [globals.css](app/globals.css) is capped at `max-width: 1280px` with auto margins — pages should not add their own outer container/max-width.
- Feature folders: dashboard ([components/home/](components/home/) — `HomeDashboard`, `TransactionCharts`, `CategoryTransactionList` (drilldown shown when a category row is clicked in the chart panel), `TransactionHistory`, `AddTransactionFab`), input ([components/input/](components/input/) — `InputPageContent`, `BackToHomeFab`), shared form ([components/transactions/TransactionForm.tsx](components/transactions/TransactionForm.tsx)), nav scaffolding ([components/nav/](components/nav/)).
- Shared leaf UI lives in [components/ui/](components/ui/) (`Modal.tsx`, `FloatingActionButton.tsx`). Top-level shared bits: [components/Navbar.tsx](components/Navbar.tsx), [components/SummaryCard.tsx](components/SummaryCard.tsx), [components/LogoutButton.tsx](components/LogoutButton.tsx).

## How I Want You to Work

### Before Coding

- Ask clarifying questions before starting
- Draft a plan for complex work and confirm before coding
- If unsure, ask — don't assume

### While Coding

- Write complete, working code — no placeholders, no TODOs
- Keep it simple and readable over clever
- Follow existing patterns in the codebase
- One change at a time, verify as you go

### After Coding

- Run tests to verify your changes work
- Run linter/formatter before finishing
- Summarize what you changed and why

---

## Code Style

- Use ES modules (import/export)
- Functional components with hooks (if React)
- Type hints on all functions
- Descriptive variable names
- No commented-out code

## Do Not

- Edit files in [protected folders]
- Commit directly to main
- Leave placeholder code or TODOs
- Make changes outside the scope of the task
- Assume — ask if unclear

---

## Verification Loop

After completing a task, verify:

1. Code compiles without errors
2. Tests pass
3. No linting warnings
4. Changes match the original request

If any fail, fix before marking complete.

---

## Quick Commands

When I type these shortcuts, do the following:

**"plan"** — Analyze the task, draft an approach, ask clarifying questions, don't write code yet

**"build"** — Implement the plan, run tests, verify it works

**"check"** — Review your changes like a skeptical senior dev. Check for bugs, edge cases, and code quality

**"verify"** — Run all tests and linting, summarize results

**"done"** — Summarize what changed, what was tested, and any notes for me

---

## Success Criteria

A task is complete when:

- [ ] Code works as requested
- [ ] Tests pass
- [ ] No errors or warnings
- [ ] Changes are minimal and focused
- [ ] I can understand what you did without explanation

---

## Notes

[Add project-specific notes, gotchas, or context here as you work]
