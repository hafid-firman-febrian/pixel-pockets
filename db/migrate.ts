import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";

config({ path: ".env.local" });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql);

  console.log("Applying migrations…");
  await migrate(db, { migrationsFolder: "./db/migrations" });
  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
