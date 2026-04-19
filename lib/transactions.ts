export const TRANSACTION_CATEGORIES = [
  "Meal",
  "Beverage",
  "Groceries",
  "Transport",
  "Selfcare",
  "Subscription",
  "E-commerce",
  "Daily Needs",
  "Entertaiment",
  "Housing",

] as const;

export type TransactionType = "Income" | "Expense";
export type TransactionCategory = string;

export interface TransactionRecord {
  id: string;
  createdAt: string;
  date: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
}

interface TransactionSeed {
  id: string;
  daysAgo: number;
  createdHour: number;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  description: string;
}

function atLocalTime(daysAgo: number, hour: number, minute: number) {
  const date = new Date();
  date.setHours(hour, minute, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function toDateOnly(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createTransaction(seed: TransactionSeed): TransactionRecord {
  const transactionDate = atLocalTime(seed.daysAgo, 12, 0);
  const createdAt = atLocalTime(seed.daysAgo, seed.createdHour, 15);

  return {
    id: seed.id,
    createdAt: createdAt.toISOString(),
    date: toDateOnly(transactionDate),
    type: seed.type,
    amount: seed.amount,
    category: seed.category,
    description: seed.description,
  };
}

const transactionSeeds: TransactionSeed[] = [
  {
    id: "txn-001",
    daysAgo: 0,
    createdHour: 8,
    type: "Income",
    amount: 4500000,
    category: "Custom",
    description: "Freelance website payout",
  },
  {
    id: "txn-002",
    daysAgo: 0,
    createdHour: 19,
    type: "Expense",
    amount: 58000,
    category: "Meal",
    description: "Dinner after client meeting",
  },
  {
    id: "txn-003",
    daysAgo: 1,
    createdHour: 9,
    type: "Expense",
    amount: 32000,
    category: "Transport",
    description: "Motorbike ride to coworking space",
  },
  {
    id: "txn-004",
    daysAgo: 2,
    createdHour: 11,
    type: "Expense",
    amount: 26000,
    category: "Beverage",
    description: "Iced coffee and mineral water",
  },
  {
    id: "txn-005",
    daysAgo: 3,
    createdHour: 7,
    type: "Income",
    amount: 1250000,
    category: "Custom",
    description: "Weekly product design retainer",
  },
  {
    id: "txn-006",
    daysAgo: 3,
    createdHour: 18,
    type: "Expense",
    amount: 99000,
    category: "Subscription",
    description: "Cloud storage subscription",
  },
  {
    id: "txn-007",
    daysAgo: 4,
    createdHour: 10,
    type: "Expense",
    amount: 184000,
    category: "Groceries",
    description: "Fresh groceries for the week",
  },
  {
    id: "txn-008",
    daysAgo: 5,
    createdHour: 20,
    type: "Expense",
    amount: 249000,
    category: "E-commerce",
    description: "USB hub and laptop stand",
  },
  {
    id: "txn-009",
    daysAgo: 6,
    createdHour: 14,
    type: "Expense",
    amount: 89000,
    category: "Daily Needs",
    description: "Household cleaning supplies",
  },
  {
    id: "txn-010",
    daysAgo: 8,
    createdHour: 9,
    type: "Expense",
    amount: 950000,
    category: "Housing",
    description: "Boarding house monthly top-up",
  },
  {
    id: "txn-011",
    daysAgo: 10,
    createdHour: 13,
    type: "Income",
    amount: 375000,
    category: "Custom",
    description: "Affiliate payout from side project",
  },
  {
    id: "txn-012",
    daysAgo: 12,
    createdHour: 16,
    type: "Expense",
    amount: 175000,
    category: "Selfcare",
    description: "Haircut and grooming supplies",
  },
  {
    id: "txn-013",
    daysAgo: 15,
    createdHour: 18,
    type: "Expense",
    amount: 145000,
    category: "Entertaiment",
    description: "Movie tickets and snacks",
  },
  {
    id: "txn-014",
    daysAgo: 18,
    createdHour: 12,
    type: "Expense",
    amount: 47000,
    category: "Meal",
    description: "Lunch with project partner",
  },
  {
    id: "txn-015",
    daysAgo: 22,
    createdHour: 8,
    type: "Expense",
    amount: 38000,
    category: "Beverage",
    description: "Coffee beans refill",
  },
  {
    id: "txn-016",
    daysAgo: 26,
    createdHour: 9,
    type: "Income",
    amount: 2000000,
    category: "Custom",
    description: "Monthly salary transfer",
  },
  {
    id: "txn-017",
    daysAgo: 31,
    createdHour: 17,
    type: "Expense",
    amount: 218000,
    category: "Groceries",
    description: "Restock kitchen ingredients",
  },
  {
    id: "txn-018",
    daysAgo: 35,
    createdHour: 9,
    type: "Expense",
    amount: 41000,
    category: "Transport",
    description: "Train fare for downtown trip",
  },
  {
    id: "txn-019",
    daysAgo: 45,
    createdHour: 8,
    type: "Income",
    amount: 820000,
    category: "Custom",
    description: "Old invoice paid by client",
  },
];

export const dummyTransactions = transactionSeeds.map(createTransaction);
