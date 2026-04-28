"use client";

import { useMemo } from "react";

import { formatCurrency, formatTransactionGroupDate } from "@/lib/dashboard";
import type { TransactionRecord } from "@/lib/transactions";

interface CategoryTransactionListProps {
  transactions: TransactionRecord[];
  category: string;
  onClear: () => void;
}

export default function CategoryTransactionList({
  transactions,
  category,
  onClear,
}: CategoryTransactionListProps) {
  const filtered = useMemo(() => {
    return transactions
      .filter(
        (transaction) =>
          transaction.type === "Expense" && transaction.category === category,
      )
      .sort((left, right) => {
        if (left.date !== right.date) {
          return left.date < right.date ? 1 : -1;
        }
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      });
  }, [transactions, category]);

  return (
    <section className="mt-4 border border-black bg-white p-4 shadow-[4px_4px_0_0_#000]">
      <header className="flex flex-col gap-3 border-b border-dashed border-slate-300 pb-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.35em] text-slate-500">
            /category transactions
          </p>
          <h4 className="text-lg font-bold text-slate-900">{category}</h4>
        </div>
        {/* <button
          type="button"
          onClick={onClear}
          className="self-start border border-black bg-white px-3 py-2 text-xs font-bold uppercase tracking-[0.25em] text-slate-700 transition-colors hover:bg-slate-100 sm:self-auto"
        >
          Clear Filter
        </button> */}
      </header>

      {filtered.length === 0 ? (
        <p className="mt-4 border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-sm text-slate-500">
          No transactions in this category for the active period.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-dashed divide-slate-300">
          {filtered.map((transaction, index) => (
            <li
              key={transaction.id}
              className={`flex flex-col gap-2 px-2 py-3 sm:flex-row sm:items-center sm:justify-between ${
                index % 2 === 0 ? "bg-white" : "bg-slate-50"
              }`}
            >
              <div className="min-w-0 space-y-1">
                <p className="truncate text-sm text-slate-700">
                  {transaction.description?.trim()
                    ? transaction.description
                    : "—"}
                </p>
                <p className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                  {formatTransactionGroupDate(transaction.date)}
                </p>
              </div>
              <p className="text-sm font-bold text-red-700 sm:text-right">
                {formatCurrency(transaction.amount)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
