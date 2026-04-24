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
