"use client";

import { useMemo, useState } from "react";

import { formatCurrency, formatTransactionGroupDate } from "@/lib/dashboard";
import type { TransactionRecord } from "@/lib/transactions";

interface CategoryTransactionListProps {
  transactions: TransactionRecord[];
  category: string;
  onClear: () => void;
}

const PAGE_SIZE = 5;

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

  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageStart = safePage * PAGE_SIZE;
  const visible = filtered.slice(pageStart, pageStart + PAGE_SIZE);

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
        <>
          <ul className="mt-3 divide-y divide-dashed divide-slate-300">
            {visible.map((transaction, index) => (
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

          {totalPages > 1 ? (
            <nav className="mt-3 flex items-center justify-between gap-3 border-t border-dashed border-slate-300 pt-3">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(0, current - 1))}
                disabled={safePage === 0}
                className="border border-black bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-900 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                ← Prev
              </button>
              <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500">
                Page {safePage + 1} / {totalPages} · {filtered.length} items
              </span>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages - 1, current + 1))
                }
                disabled={safePage >= totalPages - 1}
                className="border border-black bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.25em] text-slate-900 transition-colors hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-white"
              >
                Next →
              </button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
