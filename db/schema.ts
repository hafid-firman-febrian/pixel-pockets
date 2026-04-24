import {
  date,
  integer,
  pgTable,
  serial,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  type: varchar("type", { length: 20 }).notNull(),
  amount: integer("amount").notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }).notNull(),
  transactionDate: date("transaction_date").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type TransactionRow = typeof transactions.$inferSelect;
export type NewTransactionRow = typeof transactions.$inferInsert;
