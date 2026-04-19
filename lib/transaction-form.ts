import { TRANSACTION_CATEGORIES, type TransactionRecord, type TransactionType } from "@/lib/transactions";

export const CUSTOM_CATEGORY_OPTION = "__custom__";
export const AMOUNT_STEP = 1000;
export const QUICK_AMOUNT_OPTIONS = [
  5000,
  10000,
  15000,
  20000,
  30000,
  50000,
  100000,
] as const;

export interface TransactionFormValues {
  date: string;
  type: TransactionType;
  amount: number;
  categoryOption: string;
  customCategory: string;
  description: string;
}

export function getTodayDateValue(now: Date = new Date()) {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function createDefaultTransactionFormValues(
  now: Date = new Date(),
): TransactionFormValues {
  return {
    date: getTodayDateValue(now),
    type: "Expense",
    amount: 0,
    categoryOption: TRANSACTION_CATEGORIES[0],
    customCategory: "",
    description: "",
  };
}

export function mapTransactionToFormValues(
  transaction: TransactionRecord,
): TransactionFormValues {
  const isPresetCategory = TRANSACTION_CATEGORIES.includes(
    transaction.category as (typeof TRANSACTION_CATEGORIES)[number],
  );

  return {
    date: transaction.date,
    type: transaction.type,
    amount: transaction.amount,
    categoryOption: isPresetCategory
      ? transaction.category
      : CUSTOM_CATEGORY_OPTION,
    customCategory: isPresetCategory ? "" : transaction.category,
    description: transaction.description,
  };
}

export function resolveTransactionCategory(values: TransactionFormValues) {
  if (values.categoryOption === CUSTOM_CATEGORY_OPTION) {
    return values.customCategory.trim();
  }

  return values.categoryOption;
}
