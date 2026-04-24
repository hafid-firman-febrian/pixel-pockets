import { parse } from "csv-parse/sync";
import { config } from "dotenv";
import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { resolve } from "node:path";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

import {
  transactions,
  type NewTransactionRow,
  type TransactionRow,
} from "../db/schema";
import {
  TRANSACTION_CATEGORIES,
  type TransactionType,
} from "../lib/transactions";

config({ path: ".env.local", quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set in .env.local");
}

// ---------------------------------------------------------------------------
// Column mapping — edit the right-hand strings to match your CSV headers
// ---------------------------------------------------------------------------
const COLUMN_MAPPING = {
  date: "Date",
  type: "Type",
  amount: "Amount",
  category: "Category",
  description: "Description",
} as const;

const BATCH_SIZE = 500;
const DEFAULT_CSV_PATH = "data/transactions-import.csv";
const BACKUP_DIR = "data/backups";

interface Args {
  file: string;
  confirm: boolean;
  skipBackup: boolean;
  dryRun: boolean;
  resetIds: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    file: DEFAULT_CSV_PATH,
    confirm: false,
    skipBackup: false,
    dryRun: false,
    resetIds: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--file") args.file = argv[++i] ?? DEFAULT_CSV_PATH;
    else if (a === "--confirm") args.confirm = true;
    else if (a === "--skip-backup") args.skipBackup = true;
    else if (a === "--dry-run") args.dryRun = true;
    else if (a === "--reset-ids") args.resetIds = true;
  }

  return args;
}

// ---------------------------------------------------------------------------
// Parsers
// ---------------------------------------------------------------------------

function parseAmount(raw: string | undefined): number | null {
  if (!raw) return null;
  let s = String(raw).trim();
  if (!s) return null;

  // Strip currency prefix ("Rp", "Rp.") and any whitespace
  s = s.replace(/rp\.?\s*/i, "").replace(/\s/g, "");

  const hasComma = s.includes(",");
  const hasDot = s.includes(".");

  if (hasComma && hasDot) {
    // Both present — the rightmost one is the decimal separator
    const decSep = s.lastIndexOf(",") > s.lastIndexOf(".") ? "," : ".";
    const thouSep = decSep === "," ? "." : ",";
    s = s.split(thouSep).join("").replace(decSep, ".");
  } else if (hasComma) {
    const parts = s.split(",");
    // "50,000" → thousands ; "50,5" → decimal
    const looksLikeThousands =
      parts.length === 2 && /^\d{3}$/.test(parts[1] ?? "");
    s = looksLikeThousands ? parts.join("") : s.replace(",", ".");
  } else if (hasDot) {
    const parts = s.split(".");
    // All segments after the first must be exactly 3 digits for thousands
    const looksLikeThousands =
      parts.length >= 2 && parts.slice(1).every((p) => /^\d{3}$/.test(p));
    s = looksLikeThousands ? parts.join("") : s;
  }

  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.round(n);
}

const MIN_YEAR = 2000;
const MAX_YEAR = new Date().getFullYear() + 1;

function inYearRange(year: number): boolean {
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

function pad2(n: number | string): string {
  return String(n).padStart(2, "0");
}

function parseDate(raw: string | undefined): string | null {
  if (!raw) return null;
  const s = String(raw).trim();
  if (!s) return null;

  // 1. ISO yyyy-mm-dd — accept directly
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) {
    const [, y, m, d] = iso;
    const year = Number(y);
    if (!inYearRange(year)) return null;
    return `${y}-${m}-${d}`;
  }

  // 2. dd/mm/yyyy or dd-mm-yyyy
  const dmy = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    const [, dd, mm, yyyy] = dmy;
    const year = Number(yyyy);
    const month = Number(mm);
    const day = Number(dd);
    if (!inYearRange(year)) return null;
    if (month < 1 || month > 12) return null;
    if (day < 1 || day > 31) return null;
    return `${yyyy}-${pad2(month)}-${pad2(day)}`;
  }

  // 3. Fallback — let JS try (locale parsing). May shift by a day in weird
  // timezones; we flag the row so you can spot-check.
  const d = new Date(s);
  if (!Number.isNaN(d.getTime())) {
    const year = d.getFullYear();
    if (!inYearRange(year)) return null;
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  return null;
}

const TYPE_LOOKUP: Record<string, TransactionType> = {
  income: "Income",
  pemasukan: "Income",
  in: "Income",
  masuk: "Income",
  "+": "Income",
  expense: "Expense",
  pengeluaran: "Expense",
  out: "Expense",
  keluar: "Expense",
  "-": "Expense",
};

function parseType(raw: string | undefined): TransactionType | null {
  if (!raw) return null;
  const key = String(raw).trim().toLowerCase();
  return TYPE_LOOKUP[key] ?? null;
}

// ---------------------------------------------------------------------------
// Row validation
// ---------------------------------------------------------------------------

interface RowError {
  rowNum: number; // 1-based, counting the header as row 1
  raw: Record<string, string>;
  reasons: string[];
}

interface DateFallbackWarning {
  rowNum: number;
  raw: string;
}

interface ValidationResult {
  valid: NewTransactionRow[];
  errors: RowError[];
  unknownCategories: Map<string, number>; // category → count
  dateFallbacks: DateFallbackWarning[];
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const DMY_DATE_RE = /^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}$/;

function validateRows(
  rows: Record<string, string>[],
  presetCategories: Set<string>,
): ValidationResult {
  const valid: NewTransactionRow[] = [];
  const errors: RowError[] = [];
  const unknownCategories = new Map<string, number>();
  const dateFallbacks: DateFallbackWarning[] = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header
    const reasons: string[] = [];

    const rawDate = row[COLUMN_MAPPING.date];
    const rawType = row[COLUMN_MAPPING.type];
    const rawAmount = row[COLUMN_MAPPING.amount];
    const rawCategory = (row[COLUMN_MAPPING.category] ?? "").trim();
    const rawDescription = (row[COLUMN_MAPPING.description] ?? "").trim();

    const type = parseType(rawType);
    if (!type) reasons.push(`type: unrecognized value '${rawType ?? ""}'`);

    const amount = parseAmount(rawAmount);
    if (amount === null) {
      reasons.push(`amount: could not parse '${rawAmount ?? ""}'`);
    }

    if (!rawCategory) {
      reasons.push("category: empty");
    } else if (rawCategory.length > 100) {
      reasons.push("category: exceeds 100 chars");
    }

    if (!rawDescription) {
      reasons.push("description: empty");
    } else if (rawDescription.length > 255) {
      reasons.push("description: exceeds 255 chars");
    }

    const date = parseDate(rawDate);
    if (!date) {
      reasons.push(`date: could not parse '${rawDate ?? ""}'`);
    } else {
      const trimmed = (rawDate ?? "").trim();
      if (!ISO_DATE_RE.test(trimmed) && !DMY_DATE_RE.test(trimmed)) {
        dateFallbacks.push({ rowNum, raw: trimmed });
      }
    }

    if (reasons.length > 0) {
      errors.push({ rowNum, raw: row, reasons });
      return;
    }

    if (!presetCategories.has(rawCategory)) {
      unknownCategories.set(
        rawCategory,
        (unknownCategories.get(rawCategory) ?? 0) + 1,
      );
    }

    valid.push({
      type: type as TransactionType,
      amount: amount as number,
      category: rawCategory,
      description: rawDescription,
      transactionDate: date as string,
    });
  });

  return { valid, errors, unknownCategories, dateFallbacks };
}

// ---------------------------------------------------------------------------
// Pre-flight summary printer
// ---------------------------------------------------------------------------

function formatIDR(n: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(n);
}

function printPreflight(result: ValidationResult, csvRowCount: number) {
  const { valid, errors, unknownCategories, dateFallbacks } = result;

  const incomeTotal = valid
    .filter((r) => r.type === "Income")
    .reduce((s, r) => s + r.amount, 0);
  const expenseTotal = valid
    .filter((r) => r.type === "Expense")
    .reduce((s, r) => s + r.amount, 0);

  const categoryCounts = new Map<string, number>();
  for (const r of valid) {
    categoryCounts.set(r.category, (categoryCounts.get(r.category) ?? 0) + 1);
  }

  console.log("\n=== Pre-flight summary ===");
  console.log(`  CSV rows read:        ${csvRowCount}`);
  console.log(`  Valid (will import):  ${valid.length}`);
  console.log(`  Invalid (skipped):    ${errors.length}`);
  console.log(`  Total income:         ${formatIDR(incomeTotal)}`);
  console.log(`  Total expense:        ${formatIDR(expenseTotal)}`);

  console.log("\n  Per-category row count:");
  const sortedCategories = [...categoryCounts.entries()].sort(
    (a, b) => b[1] - a[1],
  );
  for (const [cat, count] of sortedCategories) {
    console.log(`    ${cat.padEnd(20)} ${String(count).padStart(4)}`);
  }

  if (unknownCategories.size > 0) {
    console.log("\n  Unknown categories (not in TRANSACTION_CATEGORIES):");
    for (const [cat, count] of unknownCategories) {
      console.log(`    ${cat} (${count} rows)`);
    }
    console.log(
      "  (These still import — the DB column is free-text. Normalize in the CSV or expand the preset if you want consistent UI.)",
    );
  }

  if (dateFallbacks.length > 0) {
    console.log(
      `\n  Warning: ${dateFallbacks.length} rows used JS Date fallback parsing (timezone-risky).`,
    );
    for (const { rowNum, raw } of dateFallbacks.slice(0, 5)) {
      console.log(`    row ${rowNum}: '${raw}'`);
    }
    if (dateFallbacks.length > 5) {
      console.log(`    ... and ${dateFallbacks.length - 5} more`);
    }
  }

  if (errors.length > 0) {
    console.log("\n  Skipped rows (first 10):");
    for (const err of errors.slice(0, 10)) {
      console.log(`    row ${err.rowNum}: ${err.reasons.join("; ")}`);
    }
    if (errors.length > 10) {
      console.log(`    ... and ${errors.length - 10} more`);
    }
  }
}

// ---------------------------------------------------------------------------
// Backup
// ---------------------------------------------------------------------------

function writeBackup(rows: TransactionRow[]): string {
  if (!existsSync(BACKUP_DIR)) {
    mkdirSync(BACKUP_DIR, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const path = `${BACKUP_DIR}/transactions-${timestamp}.json`;

  const payload = {
    exportedAt: new Date().toISOString(),
    rowCount: rows.length,
    rows: rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    })),
  };

  writeFileSync(path, JSON.stringify(payload, null, 2));
  return path;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function chunk<T>(arr: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    result.push(arr.slice(i, i + size));
  }
  return result;
}

async function confirmReplace(): Promise<boolean> {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await rl.question(
      "\nThis will DELETE all existing transactions. Type REPLACE to continue: ",
    );
    return answer.trim() === "REPLACE";
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const filePath = resolve(args.file);

  if (!existsSync(filePath)) {
    console.error(`\nCSV not found at: ${filePath}`);
    console.error(
      `Export your sheet to ${args.file} (File → Download → Comma Separated Values in Google Sheets), then re-run.`,
    );
    process.exit(1);
  }

  console.log(`Reading CSV: ${filePath}`);
  const raw = readFileSync(filePath);
  const rows = parse(raw, {
    columns: true,
    trim: true,
    bom: true,
    skip_empty_lines: true,
  }) as Record<string, string>[];

  if (rows.length === 0) {
    console.error("CSV is empty (no data rows after the header).");
    process.exit(1);
  }

  // Check mapping against actual headers
  const actualHeaders = Object.keys(rows[0]);
  const missing = Object.entries(COLUMN_MAPPING).filter(
    ([, csvHeader]) => !actualHeaders.includes(csvHeader),
  );
  if (missing.length > 0) {
    console.error("\nColumn mapping mismatch:");
    for (const [dbField, csvHeader] of missing) {
      console.error(
        `  Expected CSV header '${csvHeader}' for DB field '${dbField}' — not found.`,
      );
    }
    console.error(`\nActual CSV headers: ${actualHeaders.join(", ")}`);
    console.error(
      "Edit COLUMN_MAPPING in scripts/import-transactions.ts to match, then re-run.",
    );
    process.exit(1);
  }

  const presetCategories = new Set<string>(TRANSACTION_CATEGORIES);
  const result = validateRows(rows, presetCategories);
  printPreflight(result, rows.length);

  if (args.dryRun) {
    console.log("\n--dry-run: exiting without touching the database.");
    return;
  }

  if (result.valid.length === 0) {
    console.error("\nNo valid rows to import. Fix the CSV and try again.");
    process.exit(1);
  }

  // Interactive confirm
  if (!args.confirm) {
    const ok = await confirmReplace();
    if (!ok) {
      console.log("Aborted. No changes made to the database.");
      return;
    }
  }

  const started = Date.now();
  const client = neon(process.env.DATABASE_URL!);
  const db = drizzle(client);

  // Backup
  let backupPath: string | null = null;
  if (!args.skipBackup) {
    console.log("\nBacking up existing transactions…");
    const existing = await db.select().from(transactions);
    backupPath = writeBackup(existing);
    console.log(`  Backup written: ${backupPath} (${existing.length} rows)`);
  } else {
    console.log(
      "\n--skip-backup: no backup written. Proceeding at your own risk.",
    );
  }

  // Delete
  console.log("\nDeleting existing rows…");
  await db.delete(transactions);

  if (args.resetIds) {
    await db.execute(sql`ALTER SEQUENCE transactions_id_seq RESTART WITH 1`);
    console.log("  Sequence reset to 1.");
  }

  // Insert
  console.log(
    `\nInserting ${result.valid.length} rows (batch size ${BATCH_SIZE})…`,
  );
  const batches = chunk(result.valid, BATCH_SIZE);
  let inserted = 0;
  try {
    for (const [i, batch] of batches.entries()) {
      await db.insert(transactions).values(batch);
      inserted += batch.length;
      console.log(
        `  Batch ${i + 1}/${batches.length} ok (${inserted}/${result.valid.length})`,
      );
    }
  } catch (err) {
    console.error("\nInsert failed:", err);
    if (backupPath) {
      console.error(
        `\nRestore with:\n  npm run db:restore -- --file ${backupPath} --confirm\n`,
      );
    }
    process.exit(1);
  }

  const elapsed = Date.now() - started;
  console.log(
    `\nDone. Imported ${inserted} rows, skipped ${result.errors.length}, in ${elapsed}ms.`,
  );
  if (backupPath) {
    console.log(`Backup saved at: ${backupPath}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
