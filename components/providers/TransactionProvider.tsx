"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  resolveTransactionCategory,
  type TransactionFormValues,
} from "@/lib/transaction-form";
import {
  dummyTransactions,
  type TransactionRecord,
} from "@/lib/transactions";

import { useToast } from "@/components/providers/ToastProvider";

interface TransactionContextValue {
  transactions: TransactionRecord[];
  addTransaction: (values: TransactionFormValues) => TransactionRecord;
  updateTransaction: (
    id: string,
    values: TransactionFormValues,
  ) => TransactionRecord | null;
  deleteTransaction: (id: string) => boolean;
  getTransactionById: (id: string) => TransactionRecord | null;
}

const TransactionContext = createContext<TransactionContextValue | null>(null);

function buildTransactionPayload(values: TransactionFormValues) {
  return {
    date: values.date,
    type: values.type,
    amount: values.amount,
    category: resolveTransactionCategory(values),
    description: values.description.trim(),
  };
}

export function TransactionProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>(
    dummyTransactions,
  );
  const { showToast } = useToast();

  const addTransaction = useCallback(
    (values: TransactionFormValues) => {
      const nextTransaction: TransactionRecord = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...buildTransactionPayload(values),
      };

      setTransactions((current) => [nextTransaction, ...current]);
      showToast("Transaksi berhasil ditambahkan.");
      return nextTransaction;
    },
    [showToast],
  );

  const updateTransaction = useCallback(
    (id: string, values: TransactionFormValues) => {
      let updatedTransaction: TransactionRecord | null = null;

      setTransactions((current) =>
        current.map((transaction) => {
          if (transaction.id !== id) {
            return transaction;
          }

          updatedTransaction = {
            ...transaction,
            ...buildTransactionPayload(values),
          };

          return updatedTransaction;
        }),
      );

      if (updatedTransaction) {
        showToast("Transaksi berhasil diperbarui.");
      }

      return updatedTransaction;
    },
    [showToast],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      let wasDeleted = false;

      setTransactions((current) =>
        current.filter((transaction) => {
          if (transaction.id === id) {
            wasDeleted = true;
            return false;
          }

          return true;
        }),
      );

      if (wasDeleted) {
        showToast("Transaksi berhasil dihapus.");
      }

      return wasDeleted;
    },
    [showToast],
  );

  const getTransactionById = useCallback(
    (id: string) =>
      transactions.find((transaction) => transaction.id === id) ?? null,
    [transactions],
  );

  const contextValue = useMemo(
    () => ({
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
    }),
    [
      transactions,
      addTransaction,
      updateTransaction,
      deleteTransaction,
      getTransactionById,
    ],
  );

  return (
    <TransactionContext.Provider value={contextValue}>
      {children}
    </TransactionContext.Provider>
  );
}

export function useTransactions() {
  const context = useContext(TransactionContext);

  if (!context) {
    throw new Error("useTransactions must be used within TransactionProvider");
  }

  return context;
}
