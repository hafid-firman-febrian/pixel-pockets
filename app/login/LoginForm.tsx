"use client";

import { useState, useTransition } from "react";

import { loginAction } from "@/app/actions/auth";

interface LoginFormProps {
  redirectTo: string;
}

export default function LoginForm({ redirectTo }: LoginFormProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await loginAction(pin, redirectTo);
      if (result && !result.ok) {
        setError(result.error ?? "Login failed.");
      }
    });
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
      <label className="block space-y-2">
        <span className="text-sm font-bold uppercase tracking-[0.25em] text-slate-700">
          PIN
        </span>
        <input
          type="password"
          inputMode="numeric"
          autoComplete="current-password"
          value={pin}
          onChange={(event) => setPin(event.target.value)}
          disabled={isPending}
          autoFocus
          className="w-full border border-black bg-white px-4 py-3 text-lg tracking-[0.4em] text-slate-900 outline-none transition-colors focus:bg-yellow-50 disabled:bg-slate-100"
        />
      </label>

      {error ? (
        <p className="border border-black bg-red-100 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !pin}
        className="w-full border border-black bg-yellow-300 px-4 py-3 text-sm font-bold uppercase tracking-[0.25em] text-slate-900 transition-colors hover:bg-yellow-200 disabled:cursor-not-allowed disabled:bg-slate-200"
      >
        {isPending ? "Verifying…" : "Unlock"}
      </button>
    </form>
  );
}
