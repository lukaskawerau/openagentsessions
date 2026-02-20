import Link from "next/link";

import { getAuthSession } from "@/lib/auth";

import { AuthButtons } from "./auth-buttons";

export async function SiteHeader() {
  const session = await getAuthSession();

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/70 backdrop-blur">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight text-zinc-100">
            openagentsessions.org
          </Link>
          <nav className="flex items-center gap-3 text-sm text-zinc-300">
            <Link href="/submit" className="transition hover:text-zinc-100">
              submit
            </Link>
            {session?.user?.role === "MODERATOR" ? (
              <Link href="/moderation" className="transition hover:text-zinc-100">
                moderation
              </Link>
            ) : null}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {session?.user ? <span className="text-xs text-zinc-400">@{session.user.githubLogin}</span> : null}
          <AuthButtons isAuthenticated={Boolean(session?.user)} />
        </div>
      </div>
    </header>
  );
}
