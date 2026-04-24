"use server";

import { revalidatePath } from "next/cache";

import {
  createTransaction,
  deleteTransaction,
  updateTransaction,
  type TransactionInput,
} from "@/lib/server/transactions.repo";
import {
  resolveTransactionCategory,
  type TransactionFormValues,
} from "@/lib/transaction-form";
import type { TransactionRecord } from "@/lib/transactions";

function toInput(values: TransactionFormValues): TransactionInput {
  const category = resolveTransactionCategory(values).trim();
  const description = values.description.trim();

  if (!category) {
    throw new Error("Category is required.");
  }

  if (!description) {
    throw new Error("Description is required.");
  }

  if (!Number.isFinite(values.amount) || values.amount <= 0) {
    throw new Error("Amount must be greater than zero.");
  }

  return {
    date: values.date,
    type: values.type,
    amount: Math.trunc(values.amount),
    category,
    description,
  };
}

function revalidate() {
  revalidatePath("/home");
  revalidatePath("/input");
}

export async function addTransactionAction(
  values: TransactionFormValues,
): Promise<TransactionRecord> {
  const record = await createTransaction(toInput(values));
  revalidate();
  return record;
}

export async function updateTransactionAction(
  id: string,
  values: TransactionFormValues,
): Promise<TransactionRecord | null> {
  const record = await updateTransaction(id, toInput(values));
  if (record) revalidate();
  return record;
}

export async function deleteTransactionAction(id: string): Promise<boolean> {
  const deleted = await deleteTransaction(id);
  if (deleted) revalidate();
  return deleted;
}
