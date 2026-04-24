"use client";

import { useCallback } from "react";

import {
  addTransactionAction,
  deleteTransactionAction,
  updateTransactionAction,
} from "@/app/actions/transactions";
import { useToast } from "@/components/providers/ToastProvider";
import type { TransactionFormValues } from "@/lib/transaction-form";
import type { TransactionRecord } from "@/lib/transactions";

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function useTransactionActions() {
  const { showToast } = useToast();

  const addTransaction = useCallback(
    async (
      values: TransactionFormValues,
    ): Promise<TransactionRecord | null> => {
      try {
        const record = await addTransactionAction(values);
        showToast("Transaction added successfully.");
        return record;
      } catch (error) {
        showToast(errorMessage(error, "Failed to add transaction."));
        return null;
      }
    },
    [showToast],
  );

  const updateTransaction = useCallback(
    async (
      id: string,
      values: TransactionFormValues,
    ): Promise<TransactionRecord | null> => {
      try {
        const record = await updateTransactionAction(id, values);
        if (record) {
          showToast("Transaction updated successfully.");
        }
        return record;
      } catch (error) {
        showToast(errorMessage(error, "Failed to update transaction."));
        return null;
      }
    },
    [showToast],
  );

  const deleteTransaction = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const deleted = await deleteTransactionAction(id);
        if (deleted) {
          showToast("Transaction deleted successfully.");
        }
        return deleted;
      } catch (error) {
        showToast(errorMessage(error, "Failed to delete transaction."));
        return false;
      }
    },
    [showToast],
  );

  return { addTransaction, updateTransaction, deleteTransaction };
}
