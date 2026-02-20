"use client";

import { signIn, signOut } from "next-auth/react";

type AuthButtonsProps = {
  isAuthenticated: boolean;
};

export function AuthButtons({ isAuthenticated }: AuthButtonsProps) {
  if (isAuthenticated) {
    return (
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="rounded-lg border border-zinc-700 px-3 py-1.5 text-sm text-zinc-200 transition hover:border-zinc-500"
      >
        Sign out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => signIn("github", { callbackUrl: "/submit" })}
      className="rounded-lg bg-emerald-400 px-3 py-1.5 text-sm font-semibold text-black transition hover:bg-emerald-300"
    >
      Sign in with GitHub
    </button>
  );
}
