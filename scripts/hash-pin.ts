import { randomBytes } from "node:crypto";

import { hashPin } from "../lib/auth/pin";

async function main() {
  const pin = process.argv[2];
  if (!pin) {
    console.error("Usage: npm run auth:hash-pin -- <PIN>");
    console.error("Example: npm run auth:hash-pin -- 123456");
    process.exit(1);
  }

  const hash = await hashPin(pin);
  const secret = randomBytes(32).toString("hex");

  console.log("\nAdd these to .env.local (and Vercel env vars):\n");
  console.log(`PIN_HASH=${hash}`);
  console.log(`SESSION_SECRET=${secret}`);
  console.log(
    "\nKeep both secret. Re-run this script to rotate; existing sessions will become invalid.\n",
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
