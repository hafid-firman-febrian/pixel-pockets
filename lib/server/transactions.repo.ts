import "server-only";

import { desc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import { transactions, type TransactionRow } from "@/db/schema";
import type { TransactionRecord, TransactionType } from "@/lib/transactions";

export interface TransactionInput {
  date: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
}

function rowToRecord(row: TransactionRow): TransactionRecord {
  return {
    id: String(row.id),
    createdAt: row.createdAt.toISOString(),
    date: row.transactionDate,
    type: row.type as TransactionType,
    amount: row.amount,
    category: row.category,
    description: row.description,
  };
}

function parseId(id: string): number | null {
  const parsed = Number(id);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

export async function listTransactions(): Promise<TransactionRecord[]> {
  const rows = await db
    .select()
    .from(transactions)
    .orderBy(desc(transactions.transactionDate), desc(transactions.createdAt));

  return rows.map(rowToRecord);
}

export async function getTransactionById(
  id: string,
): Promise<TransactionRecord | null> {
  const numericId = parseId(id);
  if (numericId === null) return null;

  const rows = await db
    .select()
    .from(transactions)
    .where(eq(transactions.id, numericId))
    .limit(1);

  return rows[0] ? rowToRecord(rows[0]) : null;
}

export async function createTransaction(
  input: TransactionInput,
): Promise<TransactionRecord> {
  const [row] = await db
    .insert(transactions)
    .values({
      type: input.type,
      amount: input.amount,
      category: input.category,
      description: input.description,
      transactionDate: input.date,
    })
    .returning();

  return rowToRecord(row);
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<TransactionRecord | null> {
  const numericId = parseId(id);
  if (numericId === null) return null;

  const [row] = await db
    .update(transactions)
    .set({
      type: input.type,
      amount: input.amount,
      category: input.category,
      description: input.description,
      transactionDate: input.date,
    })
    .where(eq(transactions.id, numericId))
    .returning();

  return row ? rowToRecord(row) : null;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  const numericId = parseId(id);
  if (numericId === null) return false;

  const result = await db
    .delete(transactions)
    .where(eq(transactions.id, numericId))
    .returning({ id: transactions.id });

  return result.length > 0;
}
