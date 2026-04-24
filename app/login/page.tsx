import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import LoginForm from "@/app/login/LoginForm";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
} from "@/lib/auth/session";

interface LoginPageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (verifySessionToken(token)) {
    redirect("/home");
  }

  const { next } = await searchParams;
  const redirectTo =
    typeof next === "string" && next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/home";

  return (
    <section className="flex min-h-[calc(100vh-64px)] items-center justify-center p-4">
      <div className="w-full max-w-md border border-black bg-white p-6 shadow-[8px_8px_0_0_#000]">
        <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
          /login
        </p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">
          Enter your PIN.
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Pixel-Pockets is gated. Key in the PIN to access your dashboard.
        </p>

        <LoginForm redirectTo={redirectTo} />
      </div>
    </section>
  );
}
