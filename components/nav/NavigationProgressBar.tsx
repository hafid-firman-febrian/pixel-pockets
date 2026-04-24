"use client";

import { useNavigationStatus } from "@/components/providers/NavigationStatusProvider";

export default function NavigationProgressBar() {
  const { isPending } = useNavigationStatus();

  return (
    <div
      aria-hidden
      className={`pointer-events-none fixed inset-x-0 top-0 z-50 h-[3px] overflow-hidden transition-opacity duration-150 ${
        isPending ? "opacity-100" : "opacity-0"
      }`}
    >
      <div
        className="h-full w-full bg-yellow-300 origin-left"
        style={{
          animation: isPending
            ? "nav-progress-slide 1.1s ease-in-out infinite"
            : undefined,
        }}
      />
    </div>
  );
}
