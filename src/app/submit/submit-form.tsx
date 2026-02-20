"use client";

import { useActionState } from "react";

import { submitGistAction } from "@/app/submit/actions";
import { initialSubmissionState, type SubmissionFormState } from "@/app/submit/types";

export function SubmitForm() {
  const [state, formAction, isPending] = useActionState<SubmissionFormState, FormData>(
    submitGistAction,
    initialSubmissionState,
  );

  return (
    <form action={formAction} className="space-y-4 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6">
      <label className="block space-y-2">
        <span className="text-sm text-zinc-400">Public gist URL</span>
        <input
          type="url"
          name="gistUrl"
          required
          placeholder="https://gist.github.com/yourname/abcdef123456"
          className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none ring-emerald-500 transition focus:ring-2"
        />
      </label>

      <label className="flex items-start gap-3 text-sm text-zinc-300">
        <input
          type="checkbox"
          name="attested"
          required
          className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-950 text-emerald-500"
        />
        <span>I confirm I own this gist, removed secrets, and can dedicate the content to CC0.</span>
      </label>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-emerald-400 px-4 py-2 text-sm font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Submitting..." : "Submit gist"}
      </button>

      {state.status !== "idle" ? (
        <p className={state.status === "error" ? "text-sm text-rose-400" : "text-sm text-emerald-400"}>
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
