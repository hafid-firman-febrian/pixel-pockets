"use client";

import { useState } from "react";

import SummaryCard from "@/components/SummaryCard";
import TransactionCharts from "@/components/home/TransactionCharts";
import {
  buildCategoryData,
  buildSummary,
  buildTrendData,
  filterTransactions,
  getFilterLabel,
  type DashboardFilter,
} from "@/lib/dashboard";
import type { TransactionRecord } from "@/lib/transactions";

interface HomeDashboardProps {
  transactions: TransactionRecord[];
}

const FILTER_OPTIONS: { label: string; value: DashboardFilter }[] = [
  { label: "All", value: "all" },
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
];

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

export default function HomeDashboard({ transactions }: HomeDashboardProps) {
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");

  const filteredTransactions = filterTransactions(transactions, activeFilter);
  const summary = buildSummary(filteredTransactions);
  const trendData = buildTrendData(filteredTransactions);
  const categoryData = buildCategoryData(filteredTransactions);

  return (
    <section className="space-y-6 pb-8">
      <div className="border border-black bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
              /home dashboard
            </p>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Track the money. Spot the pattern.
            </h1>
            {/* <p className="max-w-2xl text-sm leading-6 text-slate-700">
              Dashboard ini memakai data dummy dengan struktur yang sudah selaras
              dengan Google Spreadsheet final. Semua angka dan chart di bawah
              membaca sumber data yang sama.
            </p> */}
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            {FILTER_OPTIONS.map((option) => (
              <FilterButton
                key={option.value}
                isActive={activeFilter === option.value}
                label={option.label}
                onClick={() => setActiveFilter(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 border-t border-dashed border-slate-300 pt-4 text-xs uppercase tracking-[0.25em] text-slate-500 md:flex-row md:items-center md:justify-between">
          <span>[ active filter: {getFilterLabel(activeFilter)} ]</span>
          <span>[ {filteredTransactions.length} visible transactions ]</span>
        </div>
      </div>

      <SummaryCard
        income={summary.income}
        expense={summary.expense}
        filterLabel={getFilterLabel(activeFilter)}
        transactionCount={filteredTransactions.length}
      />

      <TransactionCharts
        trendData={trendData}
        categoryData={categoryData}
        filterLabel={getFilterLabel(activeFilter)}
      />
    </section>
  );
}
