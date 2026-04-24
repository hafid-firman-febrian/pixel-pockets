# Pixel-Pockets

A single-user personal finance tracker built with Next.js 16 (App Router), Drizzle ORM, Neon Postgres, and a PIN-gated auth layer.

---

## Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16.2.3 (Turbopack) + React 19.2 |
| Styling | Tailwind CSS v4 (CSS-first, no config file) |
| Database | Neon serverless Postgres via `@neondatabase/serverless` (HTTP driver) |
| ORM / migrations | Drizzle ORM + drizzle-kit |
| Auth | PIN + HMAC-signed session cookie (Node `crypto`, no libraries) |
| Hosting | Vercel (Hobby tier), Neon free tier |

---

## First-time setup

All commands run from the repo root.

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Neon project

1. Sign up at https://neon.tech (free tier is fine).
2. Create a new project.
3. On the project dashboard, copy the **pooled connection string** from "Connection Details".

### 3. Create `.env.local`

Create a `.env.local` file at the repo root. Start with just the DB URL — the auth secrets come from the next steps.

```bash
# Neon connection string
DATABASE_URL=postgresql://user:password@ep-xxx.neon.tech/neondb?sslmode=require
```

### 4. Apply the database schema

```bash
npm run db:migrate
```

This runs every SQL file under `db/migrations/` against your Neon project and records the state in a `drizzle.__drizzle_migrations` table.

### 5. (Optional) Seed dummy data

Useful for first-time local testing so the dashboard isn't empty.

```bash
npm run db:seed
```

Inserts 19 sample transactions spread across the past ~45 days. The script is idempotent — it bails if the table already has rows. Pass `-- --force` to wipe and reseed:

```bash
npm run db:seed -- --force
```

### 6. Generate a PIN and session secret

Pick your PIN (any string; 6 digits is common). Then:

```bash
npm run auth:hash-pin -- 123456
```

The script prints two lines — copy both into `.env.local` alongside `DATABASE_URL`:

```
PIN_HASH=<salt>:<hash>
SESSION_SECRET=<64 hex chars>
```

> Re-running the script prints a fresh hash and a new secret. Replacing either value invalidates all existing sessions (users must re-enter the PIN).

Your `.env.local` should now have three lines:

```bash
DATABASE_URL=postgresql://...
PIN_HASH=...:...
SESSION_SECRET=...
```

### 7. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000. You'll be redirected to `/login`. Enter the PIN you used in step 6 → dashboard.

---

## Rotating the PIN

Run the hash-pin script again with the new PIN:

```bash
npm run auth:hash-pin -- newPIN
```

Replace `PIN_HASH` and (optionally) `SESSION_SECRET` in `.env.local` **and** in your Vercel environment variables. Existing sessions are invalidated the moment `SESSION_SECRET` changes, since HMAC signatures are recomputed against the new key.

---

## Importing transactions from CSV

Use this when you have an external sheet of real transactions (e.g., Google Sheets, Numbers, Excel) and want to replace what's currently in the DB.

### Steps

1. **Export the sheet to CSV.** In Google Sheets: **File → Download → Comma Separated Values**.
2. Save the file to `data/transactions-import.csv` at the repo root. The `data/` folder is gitignored so the CSV never ends up in source control.
3. **Align the column mapping.** Open [scripts/import-transactions.ts](scripts/import-transactions.ts) and edit the `COLUMN_MAPPING` const near the top. The right-hand strings are the headers in your CSV. The script will fail fast with a clear diff if a mapped header is missing.
4. **Dry-run first.** See what would be imported without touching the DB:
   ```bash
   npm run db:import -- --dry-run
   ```
   Inspect the summary: valid count, per-type totals, unknown categories, skipped rows. Fix upstream in the sheet if anything's off.
5. **Import for real:**
   ```bash
   npm run db:import
   ```
   Type `REPLACE` at the prompt to confirm. A JSON backup of your current DB is written to `data/backups/` **before** the wipe. The script then deletes all rows and bulk-inserts the CSV contents in batches of 500.

Flags:
- `--file <path>` — alternate CSV path (default `data/transactions-import.csv`).
- `--confirm` — skip the interactive prompt (for scripted runs).
- `--skip-backup` — skip the pre-wipe backup (not recommended).
- `--dry-run` — show the summary and exit without touching the DB.
- `--reset-ids` — reset the `id` serial sequence to 1 after wipe (default: leave it).

**Stop `npm run dev` before importing** — holding open DB queries while wiping and re-inserting races with the UI.

### Supported source formats

The parser is opinionated about the messy shapes you get out of Google Sheets:

| Field | Accepted | Examples |
|---|---|---|
| `type` | case-insensitive lookup | `Income` / `Expense`, `Pemasukan` / `Pengeluaran`, `Masuk` / `Keluar`, `+` / `-` |
| `amount` | integer IDR, currency/grouping stripped | `50000`, `Rp 50.000`, `50,000`, `Rp 1.500.000`, `50.000,00` |
| `transactionDate` | ISO or day-first | `2025-09-14`, `14/09/2025`, `14-09-2025`. A locale fallback is used for anything else and flagged as timezone-risky. |
| `category` | free text, ≤ 100 chars | Unknown values (not in `TRANSACTION_CATEGORIES`) still import — the DB column is free-text. |
| `description` | non-empty, ≤ 255 chars | Rows exceeding 255 chars are skipped with an error. |

Rows that fail any of these are **skipped**, reported by row number at the end, and the rest of the import proceeds.

### Rolling back

Every import writes a backup JSON at `data/backups/transactions-<timestamp>.json` before deleting. To restore:

```bash
npm run db:restore -- --file data/backups/transactions-2026-04-25T10-00-00-000Z.json
```

Type `RESTORE` at the prompt. The restore script preserves original `id` values and repairs the serial sequence via `setval(pg_get_serial_sequence(...), MAX(id))`.

Add `--confirm` to skip the prompt.

---

## Deploying to Vercel

The repo is ready to deploy — Vercel auto-detects Next.js. Only thing you need is to mirror `.env.local` into Vercel's environment variables.

1. Import the repo on Vercel → the project is created.
2. Go to **Settings → Environment Variables** and add the following, ticking **Production**, **Preview**, and **Development** for each:
   - `DATABASE_URL`
   - `PIN_HASH`
   - `SESSION_SECRET`
3. Redeploy the latest commit (env vars do not apply retroactively).

Schema changes deploy automatically because SQL files under `db/migrations/` are committed — run `npm run db:migrate` locally after generating, or wire the migration into CI if you want automation.

---

## Command reference

| Command | What it does |
|---|---|
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run db:generate` | Generate a new migration SQL after editing `db/schema.ts` |
| `npm run db:migrate` | Apply pending migrations to Neon |
| `npm run db:push` | Dev-only: sync schema without tracking migrations |
| `npm run db:studio` | Launch Drizzle Studio to browse data |
| `npm run db:seed` | Insert dummy transactions (no-op if table non-empty) |
| `npm run db:seed -- --force` | Wipe and reseed |
| `npm run db:import` | Import from `data/transactions-import.csv` (wipes DB, writes backup first) |
| `npm run db:import -- --dry-run` | Preview the import without touching the DB |
| `npm run db:restore -- --file <path>` | Restore from a backup JSON under `data/backups/` |
| `npm run auth:hash-pin -- <PIN>` | Hash a PIN and generate a session secret |

---

## Project layout

```
app/
  actions/           Server Actions (auth, transactions)
  home/              Dashboard route (server component)
  input/             Entry form route
  login/             PIN login route
  layout.tsx         Root layout
components/
  home/              Dashboard widgets
  input/             Entry form widgets
  providers/         Client providers (toast)
  transactions/      Shared TransactionForm
  ui/                Generic UI primitives
db/
  schema.ts          Drizzle table definitions
  client.ts          Drizzle client (server-only)
  migrate.ts         Custom migrator using neon-http driver
  migrations/        Committed SQL migrations
  seed.ts            Seeds dummy data
hooks/
  useTransactionActions.ts   Toast-wrapped action callbacks
lib/
  auth/              PIN hashing + session tokens (node:crypto)
  server/            DB access (repo layer)
  transactions.ts    TransactionRecord type + dummy data (for seed)
  transaction-form.ts  Form model <-> record conversion
  dashboard.ts       Pure aggregation + formatting helpers
scripts/
  hash-pin.ts        Generates PIN_HASH + SESSION_SECRET
proxy.ts             Route gate (formerly middleware.ts in Next <=15)
```

---

## Troubleshooting

**`relation "transactions" already exists` on first migrate.** The table was created by a previous half-applied run. Either drop it in Neon's SQL editor (`DROP TABLE transactions; DROP SCHEMA IF EXISTS drizzle CASCADE;`) then re-run `npm run db:migrate`, or bootstrap the migration bookkeeping manually.

**Hydration warnings on `<body>` in dev.** A browser extension (password manager, Grammarly, etc.) is adding attributes before React hydrates. Harmless — `<body>` has `suppressHydrationWarning` so the warning is filtered; nothing server-side is actually failing.

**`Auth is not configured.` on login.** `PIN_HASH` or `SESSION_SECRET` isn't set in the environment. On Vercel, env var changes require a redeploy — they don't apply retroactively.

**Cold-start delay when hitting the app after a while.** Neon free tier auto-suspends after ~5 minutes of idle. The first request wakes the database (1–2s); `app/home/loading.tsx` shows a skeleton during this window.
