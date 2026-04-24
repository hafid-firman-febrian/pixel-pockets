"use client";

import type { ReactNode } from "react";

import NavigationProgressBar from "@/components/nav/NavigationProgressBar";
import { NavigationStatusProvider } from "@/components/providers/NavigationStatusProvider";
import { ToastProvider } from "@/components/providers/ToastProvider";

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <NavigationStatusProvider>
      <NavigationProgressBar />
      <ToastProvider>{children}</ToastProvider>
    </NavigationStatusProvider>
  );
}
