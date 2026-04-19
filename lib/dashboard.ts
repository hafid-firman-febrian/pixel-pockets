import type { TransactionCategory, TransactionRecord } from "@/lib/transactions";

export type DashboardFilter = "all" | "month" | "week";

export interface SummaryTotals {
  income: number;
  expense: number;
}

export interface TrendDatum {
  label: string;
  income: number;
  expense: number;
}

export interface CategoryDatum {
  category: TransactionCategory;
  amount: number;
}

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

function parseDateOnly(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function startOfWeek(date: Date) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);

  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  start.setDate(start.getDate() + diff);

  return start;
}

function endOfWeek(date: Date) {
  const end = startOfWeek(date);
  end.setDate(end.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function getFilterLabel(filter: DashboardFilter) {
  switch (filter) {
    case "month":
      return "bulan ini";
    case "week":
      return "minggu ini";
    default:
      return "semua data";
  }
}

export function filterTransactions(
  transactions: TransactionRecord[],
  filter: DashboardFilter,
  now: Date = new Date(),
) {
  if (filter === "all") {
    return [...transactions];
  }

  const reference = new Date(now);
  reference.setHours(12, 0, 0, 0);

  const weekStart = startOfWeek(reference);
  const weekEnd = endOfWeek(reference);

  return transactions.filter((transaction) => {
    const transactionDate = parseDateOnly(transaction.date);

    if (filter === "month") {
      return (
        transactionDate.getFullYear() === reference.getFullYear() &&
        transactionDate.getMonth() === reference.getMonth()
      );
    }

    return transactionDate >= weekStart && transactionDate <= weekEnd;
  });
}

export function buildSummary(transactions: TransactionRecord[]): SummaryTotals {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.type === "Income") {
        totals.income += transaction.amount;
      } else {
        totals.expense += transaction.amount;
      }

      return totals;
    },
    { income: 0, expense: 0 },
  );
}

export function buildTrendData(transactions: TransactionRecord[]): TrendDatum[] {
  const groupedByDate = new Map<string, TrendDatum>();

  const sortedTransactions = [...transactions].sort((left, right) => {
    return parseDateOnly(left.date).getTime() - parseDateOnly(right.date).getTime();
  });

  for (const transaction of sortedTransactions) {
    const current = groupedByDate.get(transaction.date) ?? {
      label: shortDateFormatter.format(parseDateOnly(transaction.date)),
      income: 0,
      expense: 0,
    };

    if (transaction.type === "Income") {
      current.income += transaction.amount;
    } else {
      current.expense += transaction.amount;
    }

    groupedByDate.set(transaction.date, current);
  }

  return Array.from(groupedByDate.values());
}

export function buildCategoryData(
  transactions: TransactionRecord[],
): CategoryDatum[] {
  const totalsByCategory = new Map<TransactionCategory, number>();

  for (const transaction of transactions) {
    if (transaction.type !== "Expense") {
      continue;
    }

    const currentAmount = totalsByCategory.get(transaction.category) ?? 0;
    totalsByCategory.set(transaction.category, currentAmount + transaction.amount);
  }

  return Array.from(totalsByCategory.entries())
    .sort((left, right) => right[1] - left[1])
    .map(([category, amount]) => ({
      category,
      amount,
    }));
}
