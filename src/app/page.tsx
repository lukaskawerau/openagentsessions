import { prisma } from "@/lib/prisma";

import { StateBadge } from "@/components/state-badge";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [approvedCount, pendingCount, submissions] = await Promise.all([
    prisma.submission.count({ where: { state: "APPROVED" } }),
    prisma.submission.count({ where: { state: "PENDING" } }),
    prisma.submission.findMany({
      where: { state: "APPROVED", isAvailable: true },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        gistUrl: true,
        gistOwnerLogin: true,
        gistDescription: true,
        createdAt: true,
        state: true,
      },
    }),
  ]);

  return (
    <main className="mx-auto w-full max-w-5xl space-y-8 px-4 py-10">
      <section className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8">
        <h1 className="text-4xl font-bold tracking-tight text-zinc-50">Open coding-agent sessions for model training.</h1>
        <p className="mt-4 max-w-3xl text-zinc-300">
          Submit your own redacted GitHub gist. We verify gist ownership, keep only metadata, and moderate before listing.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm">
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/15 px-3 py-1.5 text-emerald-200">
            approved: {approvedCount}
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/15 px-3 py-1.5 text-amber-200">
            pending: {pendingCount}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-zinc-100">Approved submissions</h2>
        <div className="overflow-hidden rounded-2xl border border-zinc-800">
          <table className="w-full divide-y divide-zinc-800 text-sm">
            <thead className="bg-zinc-900/70 text-left text-zinc-300">
              <tr>
                <th className="px-4 py-3 font-medium">Gist</th>
                <th className="px-4 py-3 font-medium">Owner</th>
                <th className="px-4 py-3 font-medium">State</th>
                <th className="px-4 py-3 font-medium">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-950/40 text-zinc-100">
              {submissions.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-400" colSpan={4}>
                    No approved sessions yet.
                  </td>
                </tr>
              ) : (
                submissions.map((submission) => (
                  <tr key={submission.id}>
                    <td className="px-4 py-3">
                      <a href={submission.gistUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200">
                        {submission.gistDescription?.trim() || submission.gistUrl}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-zinc-300">@{submission.gistOwnerLogin}</td>
                    <td className="px-4 py-3">
                      <StateBadge state={submission.state} />
                    </td>
                    <td className="px-4 py-3 text-zinc-400">{submission.createdAt.toISOString().slice(0, 10)}</td>
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
