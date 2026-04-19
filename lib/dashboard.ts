import type { TransactionCategory, TransactionRecord } from "@/lib/transactions";

export type DashboardFilter = "all" | "month" | "week";
export type TransactionListFilter = "all" | "month" | "week" | "year";

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

export interface TransactionGroup {
  date: string;
  label: string;
  transactions: TransactionRecord[];
}

export interface TransactionPeriodState {
  filter: TransactionListFilter;
  offset: number;
}

export interface TransactionListPeriodResult {
  transactions: TransactionRecord[];
  label: string;
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

const fullDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

const monthFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  year: "numeric",
});

const yearFormatter = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
});

const weekRangeFormatter = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function parseDateOnly(value: string) {
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

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function addYears(date: Date, years: number) {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + years);
  return next;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

function startOfYear(date: Date) {
  return new Date(date.getFullYear(), 0, 1, 0, 0, 0, 0);
}

function endOfYear(date: Date) {
  return new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function formatWeekRange(start: Date, end: Date) {
  return `${weekRangeFormatter.format(start)} - ${weekRangeFormatter.format(end)}`;
}

export function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

export function getFilterLabel(filter: DashboardFilter) {
  switch (filter) {
    case "month":
      return "this month";
    case "week":
      return "this week";
    default:
      return "all data";
  }
}

export function getTransactionListFilterLabel(filter: TransactionListFilter) {
  switch (filter) {
    case "month":
      return "this month";
    case "week":
      return "this week";
    case "year":
      return "this year";
    default:
      return "all adata";
  }
}

export function getTransactionPeriodLabel(
  filter: TransactionListFilter,
  offset: number,
  now: Date = new Date(),
) {
  if (filter === "all") {
    return "semua data";
  }

  const reference = new Date(now);
  reference.setHours(12, 0, 0, 0);

  if (filter === "week") {
    const shifted = addDays(reference, offset * 7);
    const periodStart = startOfWeek(shifted);
    const periodEnd = endOfWeek(shifted);
    return formatWeekRange(periodStart, periodEnd);
  }

  if (filter === "month") {
    return monthFormatter.format(addMonths(reference, offset));
  }

  return yearFormatter.format(addYears(reference, offset));
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

export function filterTransactionsForList(
  transactions: TransactionRecord[],
  filter: TransactionListFilter,
  offset: number = 0,
  now: Date = new Date(),
) {
  if (filter === "all") {
    return [...transactions];
  }

  const reference = new Date(now);
  reference.setHours(12, 0, 0, 0);

  let periodStart: Date;
  let periodEnd: Date;

  if (filter === "week") {
    const shifted = addDays(reference, offset * 7);
    periodStart = startOfWeek(shifted);
    periodEnd = endOfWeek(shifted);
  } else if (filter === "month") {
    const shifted = addMonths(reference, offset);
    periodStart = startOfMonth(shifted);
    periodEnd = endOfMonth(shifted);
  } else {
    const shifted = addYears(reference, offset);
    periodStart = startOfYear(shifted);
    periodEnd = endOfYear(shifted);
  }

  return transactions.filter((transaction) => {
    const transactionDate = parseDateOnly(transaction.date);
    return transactionDate >= periodStart && transactionDate <= periodEnd;
  });
}

export function getTransactionListPeriodResult(
  transactions: TransactionRecord[],
  state: TransactionPeriodState,
  now: Date = new Date(),
): TransactionListPeriodResult {
  return {
    transactions: filterTransactionsForList(
      transactions,
      state.filter,
      state.offset,
      now,
    ),
    label: getTransactionPeriodLabel(state.filter, state.offset, now),
  };
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

export function buildTransactionTotals(transactions: TransactionRecord[]) {
  return buildSummary(transactions);
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

export function formatTransactionGroupDate(date: string) {
  return fullDateFormatter.format(parseDateOnly(date));
}

export function groupTransactionsByDay(
  transactions: TransactionRecord[],
): TransactionGroup[] {
  const groupedByDate = new Map<string, TransactionRecord[]>();

  const sortedTransactions = [...transactions].sort((left, right) => {
    const rightDate = parseDateOnly(right.date).getTime();
    const leftDate = parseDateOnly(left.date).getTime();

    if (rightDate !== leftDate) {
      return rightDate - leftDate;
    }

    return (
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    );
  });

  for (const transaction of sortedTransactions) {
    const current = groupedByDate.get(transaction.date) ?? [];
    current.push(transaction);
    groupedByDate.set(transaction.date, current);
  }

  return Array.from(groupedByDate.entries()).map(([date, records]) => ({
    date,
    label: formatTransactionGroupDate(date),
    transactions: records,
  }));
}
