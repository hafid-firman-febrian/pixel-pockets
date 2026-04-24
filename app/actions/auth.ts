"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { verifyPin } from "@/lib/auth/pin";
import {
  SESSION_COOKIE_NAME,
  SESSION_MAX_AGE,
  createSessionToken,
} from "@/lib/auth/session";

interface LoginResult {
  ok: boolean;
  error?: string;
}

export async function loginAction(
  pin: string,
  redirectTo: string,
): Promise<LoginResult> {
  const storedHash = process.env.PIN_HASH;
  if (!storedHash) {
    return { ok: false, error: "Auth is not configured." };
  }

  const trimmed = pin.trim();
  if (!trimmed) {
    return { ok: false, error: "PIN is required." };
  }

  const ok = await verifyPin(trimmed, storedHash);
  if (!ok) {
    return { ok: false, error: "Incorrect PIN." };
  }

  const { token, expiresAt } = createSessionToken();
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
    maxAge: SESSION_MAX_AGE,
  });

  redirect(isSafeRedirect(redirectTo) ? redirectTo : "/home");
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
  redirect("/login");
}

function isSafeRedirect(value: string | undefined): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//");
}
