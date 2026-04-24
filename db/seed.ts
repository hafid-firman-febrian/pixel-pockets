import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

import { transactions } from "./schema";
import { dummyTransactions } from "../lib/transactions";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

async function main() {
  const client = neon(process.env.DATABASE_URL!);
  const db = drizzle(client);

  const force = process.argv.includes("--force");

  const [countRow] = await db
    .select({ value: sql<number>`count(*)::int` })
    .from(transactions);

  if (countRow.value > 0 && !force) {
    console.log(
      `Table already has ${countRow.value} rows. Pass --force to wipe and reseed.`,
    );
    return;
  }

  if (force && countRow.value > 0) {
    console.log(`Wiping ${countRow.value} existing rows…`);
    await db.delete(transactions);
  }

  console.log(`Inserting ${dummyTransactions.length} dummy transactions…`);

  await db.insert(transactions).values(
    dummyTransactions.map((t) => ({
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      transactionDate: t.date,
      createdAt: new Date(t.createdAt),
    })),
  );

  console.log("Seed complete.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
