import { config } from "dotenv";
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

import { transactions } from "../db/schema";

config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

interface BackupRow {
  id: number;
  type: string;
  amount: number;
  category: string;
  description: string;
  transactionDate: string;
  createdAt: string;
}

interface BackupFile {
  exportedAt: string;
  rowCount: number;
  rows: BackupRow[];
}

interface Args {
  file: string | null;
  confirm: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { file: null, confirm: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") args.file = argv[++i] ?? null;
    else if (a === "--confirm") args.confirm = true;
  }
  return args;
}

async function confirmRestore(rowCount: number): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      `\nThis will DELETE all existing transactions and restore ${rowCount} rows from the backup. Type RESTORE to continue: `,
    );
    return answer.trim() === "RESTORE";
  } finally {
    rl.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file) {
    console.error("Usage: npm run db:restore -- --file <path> [--confirm]");
    process.exit(1);
  }

  const filePath = resolve(args.file);
  if (!existsSync(filePath)) {
    console.error(`Backup not found: ${filePath}`);
    process.exit(1);
  }

  const backup = JSON.parse(readFileSync(filePath, "utf8")) as BackupFile;
  if (!Array.isArray(backup.rows)) {
    console.error("Backup file does not contain a 'rows' array.");
    process.exit(1);
  }

  console.log(
    `Backup exported at ${backup.exportedAt}, containing ${backup.rowCount} rows.`,
  );

  if (!args.confirm) {
    const ok = await confirmRestore(backup.rows.length);
    if (!ok) {
      console.log("Aborted. No changes made to the database.");
      return;
    }
  }

  const client = neon(process.env.DATABASE_URL!);
  const db = drizzle(client);

  console.log("\nDeleting existing rows…");
  await db.delete(transactions);

  console.log(`Inserting ${backup.rows.length} rows (preserving ids)…`);
  if (backup.rows.length > 0) {
    await db.insert(transactions).values(
      backup.rows.map((r) => ({
        id: r.id,
        type: r.type,
        amount: r.amount,
        category: r.category,
        description: r.description,
        transactionDate: r.transactionDate,
        createdAt: new Date(r.createdAt),
      })),
    );
  }

  // Repair the serial sequence so future inserts pick up after the max id.
  if (backup.rows.length > 0) {
    await db.execute(
      sql`SELECT setval(pg_get_serial_sequence('transactions','id'), (SELECT MAX(id) FROM transactions))`,
    );
    console.log("Serial sequence repaired to MAX(id).");
  }

  console.log(`\nDone. Restored ${backup.rows.length} rows from ${filePath}.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
