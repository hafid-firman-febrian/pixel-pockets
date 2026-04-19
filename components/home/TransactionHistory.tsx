"use client";

import Modal from "@/components/ui/Modal";
import { useTransactions } from "@/components/providers/TransactionProvider";
import TransactionForm from "@/components/transactions/TransactionForm";
import {
  buildTransactionTotals,
  formatCurrency,
  getTransactionListFilterLabel,
  getTransactionListPeriodResult,
  groupTransactionsByDay,
  parseDateOnly,
  type TransactionPeriodState,
  type TransactionListFilter,
} from "@/lib/dashboard";
import { mapTransactionToFormValues } from "@/lib/transaction-form";
import type { TransactionRecord } from "@/lib/transactions";
import { useState, type ReactNode } from "react";

interface TransactionHistoryProps {
  transactions: TransactionRecord[];
}

const FILTER_OPTIONS: { label: string; value: TransactionListFilter }[] = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
];

const rowDateFormatter = new Intl.DateTimeFormat("en-US", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

interface FilterButtonProps {
  isActive: boolean;
  label: string;
  onClick: () => void;
}

function FilterButton({ isActive, label, onClick }: FilterButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border border-black px-3 py-2 text-sm font-bold uppercase transition-colors ${
        isActive
          ? "bg-yellow-300 text-black"
          : "bg-white text-slate-700 hover:bg-slate-100"
      }`}
    >
      {label}
    </button>
  );
}

function NavigationButton({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border border-black bg-yellow-300 px-3 py-2 text-sm font-bold uppercase text-black transition-colors hover:bg-yellow-200"
    >
      {label}
    </button>
  );
}

function ActionButton({
  label,
  onClick,
  tone = "default",
}: {
  label: string;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  const className =
    tone === "danger"
      ? "bg-red-100 text-red-900 hover:bg-red-200"
      : "bg-white text-slate-900 hover:bg-slate-100";

  return (
    <button
      type="button"
      onClick={onClick}
      className={`border border-black px-3 py-2 text-xs font-bold uppercase transition-colors ${className}`}
    >
      {label}
    </button>
  );
}

function formatRowDate(date: string) {
  return rowDateFormatter.format(parseDateOnly(date));
}

function TypeBadge({ type }: { type: TransactionRecord["type"] }) {
  const className =
    type === "Income"
      ? "bg-green-100 text-green-900"
      : "bg-red-100 text-red-900";

  return (
    <span className={`inline-flex border border-black px-2 py-1 text-xs font-bold uppercase ${className}`}>
      {type}
    </span>
  );
}

function TransactionField({
  label,
  value,
  align = "left",
}: {
  label: string;
  value: ReactNode;
  align?: "left" | "right";
}) {
  const alignmentClassName = align === "right" ? "text-right" : "text-left";

  return (
    <div className={`min-w-0 space-y-1 ${alignmentClassName}`}>
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
        {label}
      </p>
      <div className="min-w-0 break-words text-sm text-slate-700">{value}</div>
    </div>
  );
}

function TransactionCard({
  transaction,
  index,
  onDelete,
  onEdit,
}: {
  transaction: TransactionRecord;
  index: number;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <article
      className={`border border-black p-4 ${
        index % 2 === 0 ? "bg-white" : "bg-slate-50"
      }`}
    >
      <div className="flex items-start justify-between gap-3 border-b border-dashed border-slate-300 pb-3">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500">
            Amount
          </p>
          <p className="mt-1 break-words text-2xl font-bold text-slate-900">
            {formatCurrency(transaction.amount)}
          </p>
        </div>
        <TypeBadge type={transaction.type} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <TransactionField
          label="Date"
          value={
            <span className="font-medium text-slate-800">
              {formatRowDate(transaction.date)}
            </span>
          }
        />
        <TransactionField
          label="Category"
          value={
            <span className="font-medium text-slate-800">
              {transaction.category}
            </span>
          }
        />
        <TransactionField
          label="Type"
          value={<TypeBadge type={transaction.type} />}
        />
        <TransactionField
          label="Description"
          value={transaction.description || "-"}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-dashed border-slate-300 pt-4">
        <ActionButton label="Edit" onClick={onEdit} />
        <ActionButton label="Hapus" onClick={onDelete} tone="danger" />
      </div>
    </article>
  );
}

export default function TransactionHistory({
  transactions,
}: TransactionHistoryProps) {
  const { deleteTransaction, updateTransaction } = useTransactions();
  const [periodState, setPeriodState] = useState<TransactionPeriodState>({
    filter: "all",
    offset: 0,
  });
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(
    null,
  );
  const [deletingTransactionId, setDeletingTransactionId] = useState<string | null>(
    null,
  );

  const filteredResult = getTransactionListPeriodResult(transactions, periodState);
  const filteredTransactions = filteredResult.transactions;
  const groupedTransactions = groupTransactionsByDay(filteredTransactions);
  const totals = buildTransactionTotals(filteredTransactions);
  const showPeriodNavigation = periodState.filter !== "all";
  const editingTransaction =
    transactions.find((transaction) => transaction.id === editingTransactionId) ??
    null;
  const deletingTransaction =
    transactions.find((transaction) => transaction.id === deletingTransactionId) ??
    null;

  function handleFilterChange(filter: TransactionListFilter) {
    setPeriodState({
      filter,
      offset: 0,
    });
  }

  function shiftPeriod(step: number) {
    setPeriodState((current) => ({
      ...current,
      offset: current.offset + step,
    }));
  }

  function handleEditSubmit(values: ReturnType<typeof mapTransactionToFormValues>) {
    if (!editingTransactionId) {
      return;
    }

    updateTransaction(editingTransactionId, values);
    setEditingTransactionId(null);
  }

  function handleDeleteConfirm() {
    if (!deletingTransactionId) {
      return;
    }

    deleteTransaction(deletingTransactionId);
    setDeletingTransactionId(null);
  }

  return (
    <>
      <section className="border border-black bg-white p-4">
        <div className="flex flex-col gap-4 border-b border-dashed border-slate-300 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
              /transaction history
            </p>
            <h2 className="text-2xl font-bold text-slate-900">
            List of recorded transactions.
            </h2>
            <p className="text-sm leading-6 text-slate-600">
            Transactions are grouped by day and sorted from newest to oldest.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {FILTER_OPTIONS.map((option) => (
              <FilterButton
                key={option.value}
                isActive={periodState.filter === option.value}
                label={option.label}
                onClick={() => handleFilterChange(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 text-xs uppercase tracking-[0.25em] text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>
            [ active table filter: {getTransactionListFilterLabel(periodState.filter)} ]
          </span>
          <span>[ {filteredTransactions.length} transactions found ]</span>
        </div>

        {showPeriodNavigation ? (
          <div className="mt-4 border border-black bg-slate-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                  /active period
                </p>
                <p className="mt-2 text-lg font-bold text-slate-900">
                  {filteredResult.label}
                </p>
              </div>

              <div className="flex gap-2">
                <NavigationButton label="Prev" onClick={() => shiftPeriod(-1)} />
                <NavigationButton label="Next" onClick={() => shiftPeriod(1)} />
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          {groupedTransactions.length === 0 ? (
            <div className="flex min-h-48 items-center justify-center border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm leading-6 text-slate-500">
              Belum ada transaksi pada rentang waktu ini.
            </div>
          ) : (
            groupedTransactions.map((group) => (
              <div key={group.date} className="space-y-3">
                <div className="border border-black bg-yellow-100 px-4 py-3">
                  <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      {group.label}
                    </h3>
                    <span className="text-xs font-bold uppercase tracking-[0.25em] text-slate-600">
                      [ {group.transactions.length} transaction rows ]
                    </span>
                  </div>
                </div>

                <div className="space-y-3 md:hidden">
                  {group.transactions.map((transaction, index) => (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      index={index}
                      onEdit={() => setEditingTransactionId(transaction.id)}
                      onDelete={() => setDeletingTransactionId(transaction.id)}
                    />
                  ))}
                </div>

                <div className="hidden overflow-x-auto border border-black md:block">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="bg-slate-900 text-xs uppercase tracking-[0.25em] text-slate-100">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Type</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Description</th>
                        <th className="px-4 py-3 text-right">Amount</th>
                        <th className="px-4 py-3 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.transactions.map((transaction, index) => (
                        <tr
                          key={transaction.id}
                          className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                        >
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {formatRowDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3">
                            <TypeBadge type={transaction.type} />
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-slate-800">
                            {transaction.category}
                          </td>
                          <td className="px-4 py-3 text-sm text-slate-600">
                            {transaction.description || "-"}
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-slate-900">
                            {formatCurrency(transaction.amount)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <ActionButton
                                label="Edit"
                                onClick={() =>
                                  setEditingTransactionId(transaction.id)
                                }
                              />
                              <ActionButton
                                label="Hapus"
                                onClick={() =>
                                  setDeletingTransactionId(transaction.id)
                                }
                                tone="danger"
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-6 border-t border-dashed border-slate-300 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="border border-black bg-green-100 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-green-800">
                Total Income
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatCurrency(totals.income)}
              </p>
            </div>

            <div className="border border-black bg-red-100 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-red-800">
                Total Expense
              </p>
              <p className="mt-3 text-2xl font-bold text-slate-900">
                {formatCurrency(totals.expense)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {editingTransaction ? (
        <Modal
          title="Edit transaksi"
          description="Perbarui detail transaksi. Form yang dipakai sama dengan form tambah data."
          onClose={() => setEditingTransactionId(null)}
        >
          <TransactionForm
            initialValues={mapTransactionToFormValues(editingTransaction)}
            submitLabel="Simpan perubahan"
            onSubmit={handleEditSubmit}
            onCancel={() => setEditingTransactionId(null)}
          />
        </Modal>
      ) : null}

      {deletingTransaction ? (
        <Modal
          title="Hapus transaksi"
          description="Konfirmasi ini akan menghapus transaksi dari histori pada session saat ini."
          onClose={() => setDeletingTransactionId(null)}
        >
          <div className="space-y-6">
            <div className="border border-black bg-slate-50 p-4">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                /transaksi terpilih
              </p>
              <div className="mt-3 space-y-2 text-sm text-slate-700">
                <p>
                  <span className="font-bold text-slate-900">Tanggal:</span>{" "}
                  {formatRowDate(deletingTransaction.date)}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Kategori:</span>{" "}
                  {deletingTransaction.category}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Nominal:</span>{" "}
                  {formatCurrency(deletingTransaction.amount)}
                </p>
                <p>
                  <span className="font-bold text-slate-900">Deskripsi:</span>{" "}
                  {deletingTransaction.description || "-"}
                </p>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setDeletingTransactionId(null)}
                className="border border-black bg-white px-4 py-3 text-sm font-bold uppercase text-slate-900 transition-colors hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                className="border border-black bg-red-100 px-4 py-3 text-sm font-bold uppercase text-red-900 transition-colors hover:bg-red-200"
              >
                Ya, hapus transaksi
              </button>
            </div>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
