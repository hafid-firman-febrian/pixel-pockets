import { config } from "dotenv";
import { desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";

import { transactions } from "../db/schema";
import { isSheetSyncConfigured, resync } from "../lib/server/sheets";
import type { TransactionRecord } from "../lib/transactions";

config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

if (!isSheetSyncConfigured()) {
  console.error(
    "Sheet sync is not configured. Set GOOGLE_SHEETS_CREDENTIALS and GOOGLE_SHEETS_ID in .env.local.",
  );
  console.error(
    "See the 'Syncing to a Google Sheet' section in README.md for setup.",
  );
  process.exit(1);
}

async function main() {
  const client = neon(process.env.DATABASE_URL!);
  const db = drizzle(client);

  console.log("Fetching all transactions from the database…");
  const rows = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

  const records: TransactionRecord[] = rows.map((r) => ({
    id: String(r.id),
    createdAt: r.createdAt.toISOString(),
    date: r.transactionDate,
    type: r.type as TransactionRecord["type"],
    amount: r.amount,
    category: r.category,
    description: r.description,
  }));

  console.log(`  Found ${records.length} rows.`);
  console.log(`\nPushing to Google Sheets…`);

  const started = Date.now();
  await resync(records);
  const elapsed = Date.now() - started;

  console.log(
    `\nDone. Sheet rebuilt with ${records.length} rows in ${elapsed}ms.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
