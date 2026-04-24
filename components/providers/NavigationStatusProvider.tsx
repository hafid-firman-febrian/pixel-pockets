"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface NavigationStatusValue {
  isPending: boolean;
  increment: () => void;
  decrement: () => void;
}

const NavigationStatusContext = createContext<NavigationStatusValue | null>(
  null,
);

export function NavigationStatusProvider({ children }: { children: ReactNode }) {
  const [pendingCount, setPendingCount] = useState(0);

  const increment = useCallback(() => {
    setPendingCount((current) => current + 1);
  }, []);

  const decrement = useCallback(() => {
    setPendingCount((current) => Math.max(0, current - 1));
  }, []);

  const value = useMemo<NavigationStatusValue>(
    () => ({ isPending: pendingCount > 0, increment, decrement }),
    [pendingCount, increment, decrement],
  );

  return (
    <NavigationStatusContext.Provider value={value}>
      {children}
    </NavigationStatusContext.Provider>
  );
}

export function useNavigationStatus(): NavigationStatusValue {
  const context = useContext(NavigationStatusContext);
  if (!context) {
    throw new Error(
      "useNavigationStatus must be used within NavigationStatusProvider",
    );
  }
  return context;
}
