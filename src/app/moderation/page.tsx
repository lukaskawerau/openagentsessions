import { moderateSubmissionAction } from "@/app/moderation/actions";
import { StateBadge } from "@/components/state-badge";
import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function ModerationPage() {
  const session = await getAuthSession();

  if (!session?.user || session.user.role !== "MODERATOR") {
    return (
      <main className="mx-auto w-full max-w-3xl px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Moderation</h1>
        <p className="mt-3 text-zinc-300">Moderator access required.</p>
      </main>
    );
  }

  const submissions = await prisma.submission.findMany({
    where: { state: { in: ["PENDING", "APPROVED"] } },
    orderBy: [{ state: "asc" }, { createdAt: "desc" }],
    take: 100,
    select: {
      id: true,
      gistUrl: true,
      gistDescription: true,
      gistOwnerLogin: true,
      state: true,
      moderationReason: true,
      createdAt: true,
      submitter: {
        select: {
          githubLogin: true,
        },
      },
    },
  });

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-50">Moderation</h1>

      <div className="space-y-4">
        {submissions.length === 0 ? (
          <p className="text-zinc-400">Queue empty.</p>
        ) : (
          submissions.map((submission) => (
            <article key={submission.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5">
              <div className="flex flex-wrap items-center gap-3">
                <a href={submission.gistUrl} target="_blank" rel="noreferrer" className="text-lg font-semibold text-emerald-300 hover:text-emerald-200">
                  {submission.gistDescription?.trim() || submission.gistUrl}
                </a>
                <StateBadge state={submission.state} />
              </div>

              <p className="mt-2 text-sm text-zinc-400">
                gist owner: @{submission.gistOwnerLogin} · submitter: @{submission.submitter.githubLogin} · created:{" "}
                {submission.createdAt.toISOString().slice(0, 10)}
              </p>

              {submission.moderationReason ? (
                <p className="mt-2 text-sm text-zinc-300">previous note: {submission.moderationReason}</p>
              ) : null}

              <form action={moderateSubmissionAction} className="mt-4 flex flex-wrap items-center gap-3">
                <input type="hidden" name="submissionId" value={submission.id} />
                <input
                  type="text"
                  name="reason"
                  placeholder="optional reason"
                  className="min-w-56 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500 transition focus:ring-2"
                />
                <button
                  type="submit"
                  name="nextState"
                  value="APPROVED"
                  className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-semibold text-black hover:bg-emerald-300"
                >
                  approve
                </button>
                <button
                  type="submit"
                  name="nextState"
                  value="REJECTED"
                  className="rounded-lg bg-amber-400 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-300"
                >
                  reject
                </button>
                <button
                  type="submit"
                  name="nextState"
                  value="REMOVED"
                  className="rounded-lg bg-rose-500 px-3 py-2 text-sm font-semibold text-rose-50 hover:bg-rose-400"
                >
                  remove
                </button>
              </form>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
