# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

- `npm run dev` — start Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — ESLint (flat config, extends `eslint-config-next`)

There is no test runner configured.

## Stack versions

- Next.js **16.2.3**, React **19.2.4**, TypeScript 5, Tailwind CSS **v4** (via `@tailwindcss/postcss`), Recharts 3.
- Tailwind v4 is configured entirely in [app/globals.css](app/globals.css) via `@import "tailwindcss"` and `@theme inline` — there is no `tailwind.config.*` file. Theme tokens (`--color-*`, `--font-*`) are declared in CSS.
- Per [AGENTS.md](AGENTS.md): Next.js 16 has breaking changes vs. older training data. When unsure about an API, check `node_modules/next/dist/docs/` before coding.

## Architecture

This is a single-user, client-side-only personal finance tracker ("Pixel-Pockets"). There is no backend, database, or auth — transactions live in React state seeded from [lib/transactions.ts](lib/transactions.ts) and **do not persist across reloads**.

### Routing (App Router)

- [app/page.tsx](app/page.tsx) redirects `/` → `/home`.
- [app/home/page.tsx](app/home/page.tsx) renders the dashboard; [app/input/page.tsx](app/input/page.tsx) renders the entry form. Both are server components that mount `Navbar` + a `"use client"` content component.
- [app/layout.tsx](app/layout.tsx) wraps everything in `AppProviders` and loads the Inconsolata font via `next/font/google`, exposing it as the `--font-inconsolata` CSS variable used by Tailwind's `font-mono`/`font-sans` tokens.

### State layer

All shared state flows through providers in [components/providers/](components/providers/), composed by [AppProviders.tsx](components/providers/AppProviders.tsx) (`ToastProvider` wraps `TransactionProvider`):

- **[TransactionProvider](components/providers/TransactionProvider.tsx)** is the single source of truth for transactions. It exposes `addTransaction`, `updateTransaction`, `deleteTransaction`, `getTransactionById` via the `useTransactions()` hook. Mutations go through `buildTransactionPayload` which calls `resolveTransactionCategory` to collapse the form's `categoryOption` + `customCategory` pair into a single stored `category` string. Each mutation also fires a toast.
- **[ToastProvider](components/providers/ToastProvider.tsx)** renders a fixed-position toast stack; call `useToast().showToast(message)` from anywhere inside the tree.

### Domain modules in `lib/`

Pure functions — no React, no I/O. Keep new business logic here.

- **[lib/transactions.ts](lib/transactions.ts)** — `TransactionRecord` type, the `TRANSACTION_CATEGORIES` preset list, and the `dummyTransactions` seed data. Amounts are IDR integers (no decimals).
- **[lib/transaction-form.ts](lib/transaction-form.ts)** — form-layer types and helpers. The form model (`TransactionFormValues`) differs from the stored model: it carries `categoryOption` + `customCategory` separately, with the sentinel `CUSTOM_CATEGORY_OPTION = "__custom__"` meaning "use the free-text field." Use `mapTransactionToFormValues` / `resolveTransactionCategory` to convert between the two representations — do not duplicate this logic in components.
- **[lib/dashboard.ts](lib/dashboard.ts)** — date-range filtering (`DashboardFilter` = all/month/week; `TransactionListFilter` also supports year + a sliding `offset` for prev/next period navigation), aggregation (`buildSummary`, `buildTrendData`, `buildCategoryData`, `groupTransactionsByDay`), and formatters. Currency uses `id-ID` IDR; dates are stored as `YYYY-MM-DD` strings and parsed with `parseDateOnly` (local-noon to avoid timezone drift).

### UI conventions

- Visual style is a "terminal / pixel" aesthetic: black 1px borders, yellow-300 highlights, hard `shadow-[Npx_Npx_0_0_#000]` drop shadows, uppercase `tracking-[0.3em]` micro-labels prefixed with `/`. Match this when adding UI.
- The body in [globals.css](app/globals.css) is capped at `max-width: 1280px` with auto margins — pages should not add their own outer container/max-width.
- Dashboard (`components/home/`) and input (`components/input/`) are feature folders; shared leaf UI lives in `components/ui/` (currently just `Modal.tsx`) and `components/SummaryCard.tsx` / `Navbar.tsx`.
