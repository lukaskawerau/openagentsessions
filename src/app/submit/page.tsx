import Link from "next/link";

import { SubmitForm } from "@/app/submit/submit-form";
import { StateBadge } from "@/components/state-badge";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SubmitPage() {
  const session = await getAuthSession();

  if (!session?.user) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-4 px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Submit a session</h1>
        <p className="text-zinc-300">Sign in with GitHub first. We only accept public gists owned by the logged-in account.</p>
        <Link href="/" className="text-emerald-300 hover:text-emerald-200">
          ← back home
        </Link>
      </main>
    );
  }

  const mySubmissions = await prisma.submission.findMany({
    where: { submitterId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 25,
    select: {
      id: true,
      gistUrl: true,
      gistDescription: true,
      state: true,
      moderationReason: true,
      updatedAt: true,
    },
  });

  return (
    <main className="mx-auto w-full max-w-3xl space-y-8 px-4 py-10">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Submit a session</h1>
        <p className="text-zinc-300">
          Requirements: public gist, your own account, no forks, secrets removed, CC0 intent confirmed.
        </p>
      </section>

      <SubmitForm />

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-zinc-100">Your submissions</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-900/70 text-left text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium">Gist</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/40 text-zinc-100">
              {mySubmissions.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-400" colSpan={3}>
                    Nothing yet.
                  </td>
                </tr>
              ) : (
                mySubmissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-4 py-3">
                      <a href={submission.gistUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">
                        {submission.gistDescription?.trim() || submission.gistUrl}
                      </a>
                      {submission.moderationReason ? (
                        <p className="mt-1 text-xs text-zinc-400">note: {submission.moderationReason}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <StateBadge state={submission.state} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{submission.updatedAt.toISOString().slice(0, 10)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
