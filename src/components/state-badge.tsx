import type { SubmissionState } from "@prisma/client";

const stateClassMap: Record<SubmissionState, string> = {
  PENDING: "border-amber-500/40 bg-amber-500/20 text-amber-200",
  APPROVED: "border-emerald-500/40 bg-emerald-500/20 text-emerald-200",
  REJECTED: "border-rose-500/40 bg-rose-500/20 text-rose-200",
  REMOVED: "border-zinc-500/40 bg-zinc-500/20 text-zinc-200",
};

type StateBadgeProps = {
  state: SubmissionState;
};

export function StateBadge({ state }: StateBadgeProps) {
  return (
    <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${stateClassMap[state]}`}>
      {state.toLowerCase()}
    </span>
  );
}
