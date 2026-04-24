"use client";

import { useLinkStatus } from "next/link";
import { useEffect } from "react";

import { useNavigationStatus } from "@/components/providers/NavigationStatusProvider";

export default function NavigationLinkReporter() {
  const { pending } = useLinkStatus();
  const { increment, decrement } = useNavigationStatus();

  useEffect(() => {
    if (!pending) return;
    increment();
    return () => decrement();
  }, [pending, increment, decrement]);

  return null;
}
