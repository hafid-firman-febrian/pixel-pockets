import Link from "next/link";
import type { ReactNode } from "react";

import NavigationLinkReporter from "@/components/nav/NavigationLinkReporter";

interface FloatingActionButtonProps {
  href: string;
  label: string;
  children: ReactNode;
}

export default function FloatingActionButton({
  href,
  label,
  children,
}: FloatingActionButtonProps) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed right-6 z-40 flex h-14 w-14 items-center justify-center border border-black bg-yellow-300 text-3xl font-bold text-slate-900 shadow-[4px_4px_0_0_#000] transition-[transform,box-shadow,background-color] hover:bg-yellow-200 active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_0_#000] md:hidden"
      style={{
        bottom: "calc(env(safe-area-inset-bottom, 0) + 1.5rem)",
      }}
    >
      {children}
      <NavigationLinkReporter />
    </Link>
  );
}
