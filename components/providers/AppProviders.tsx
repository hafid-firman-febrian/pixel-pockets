"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/providers/ToastProvider";
import { TransactionProvider } from "@/components/providers/TransactionProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <TransactionProvider>{children}</TransactionProvider>
    </ToastProvider>
  );
}
