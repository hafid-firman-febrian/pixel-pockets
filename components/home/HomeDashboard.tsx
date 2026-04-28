"use client";

import { useMemo, useState } from "react";

import AddTransactionFab from "@/components/home/AddTransactionFab";
import SummaryCard from "@/components/SummaryCard";
import TransactionCharts from "@/components/home/TransactionCharts";
import TransactionHistory from "@/components/home/TransactionHistory";
import {
  buildCategoryData,
  buildSummary,
  buildTrendData,
  filterTransactions,
  formatSalaryPeriodRange,
  getFilterLabel,
  type DashboardFilter,
} from "@/lib/dashboard";
import type { TransactionRecord } from "@/lib/transactions";

const FILTER_OPTIONS = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "Salary Period", value: "salaryPeriod" },
  { label: "Year", value: "year" },
  { label: "All", value: "all" },
] satisfies Array<{ label: string; value: DashboardFilter }>;

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

interface HomeDashboardProps {
  transactions: TransactionRecord[];
}

export default function HomeDashboard({ transactions }: HomeDashboardProps) {
  const [activeFilter, setActiveFilter] =
    useState<DashboardFilter>("salaryPeriod");

  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, activeFilter),
    [transactions, activeFilter],
  );
  const summary = useMemo(
    () => buildSummary(filteredTransactions),
    [filteredTransactions],
  );
  const trendData = useMemo(
    () => buildTrendData(filteredTransactions),
    [filteredTransactions],
  );
  const categoryData = useMemo(
    () => buildCategoryData(filteredTransactions),
    [filteredTransactions],
  );

  const filterLabel = getFilterLabel(activeFilter);
  const salaryPeriodRange =
    activeFilter === "salaryPeriod" ? formatSalaryPeriodRange() : null;

  return (
    <>
    <section className="space-y-6 pb-24 md:pb-8">
      <div className="border border-black bg-white p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
              /home dashboard
            </p>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              Track the money. Spot the pattern.
            </h1>
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
          <span>
            [ active filter: {filterLabel}
            {salaryPeriodRange ? ` / ${salaryPeriodRange}` : ""} ]
          </span>
          <span>[ {filteredTransactions.length} visible transactions ]</span>
        </div>
      </div>

      <SummaryCard
        income={summary.income}
        expense={summary.expense}
        filterLabel={filterLabel}
        transactionCount={filteredTransactions.length}
      />

      <TransactionCharts
        trendData={trendData}
        categoryData={categoryData}
        filteredTransactions={filteredTransactions}
        filterLabel={filterLabel}
      />

      <TransactionHistory transactions={transactions} />
    </section>
    <AddTransactionFab />
    </>
  );
}
