"use server";

import { SubmissionState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { verifyOwnedPublicGist } from "@/lib/gists";
import { prisma } from "@/lib/prisma";
import type { SubmissionFormState } from "./types";

const submitSchema = z.object({
  gistUrl: z.url("Paste a valid gist URL."),
  attested: z.literal("on", {
    error: "Confirm rights + redaction before submitting.",
  }),
});

export async function submitGistAction(
  _previousState: SubmissionFormState,
  formData: FormData,
): Promise<SubmissionFormState> {
  const session = await getAuthSession();

  if (!session?.user?.id || !session.user.githubId) {
    return {
      status: "error",
      message: "Sign in first.",
    };
  }

  const parsed = submitSchema.safeParse({
    gistUrl: formData.get("gistUrl"),
    attested: formData.get("attested"),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: parsed.error.issues[0]?.message ?? "Invalid form data.",
    };
  }

  let verified;

  try {
    verified = await verifyOwnedPublicGist({
      gistUrl: parsed.data.gistUrl,
      expectedOwnerGithubId: session.user.githubId,
    });
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to verify gist.",
    };
  }

  const existing = await prisma.submission.findUnique({
    where: { gistId: verified.gistId },
    select: { id: true, submitterId: true },
  });

  if (existing && existing.submitterId !== session.user.id) {
    return {
      status: "error",
      message: "This gist was already submitted by another account.",
    };
  }

  await prisma.submission.upsert({
    where: { gistId: verified.gistId },
    create: {
      gistId: verified.gistId,
      gistUrl: verified.gistUrl,
      gistOwnerId: verified.ownerId,
      gistOwnerLogin: verified.ownerLogin,
      gistDescription: verified.description,
      gistVersion: verified.version,
      gistUpdatedAt: verified.updatedAt,
      lastCheckedAt: new Date(),
      isAvailable: true,
      state: SubmissionState.PENDING,
      moderationReason: null,
      submitterId: session.user.id,
    },
    update: {
      gistUrl: verified.gistUrl,
      gistOwnerId: verified.ownerId,
      gistOwnerLogin: verified.ownerLogin,
      gistDescription: verified.description,
      gistVersion: verified.version,
      gistUpdatedAt: verified.updatedAt,
      lastCheckedAt: new Date(),
      isAvailable: true,
      state: SubmissionState.PENDING,
      moderationReason: null,
      submitterId: session.user.id,
    },
  });

  revalidatePath("/");
  revalidatePath("/submit");
  revalidatePath("/moderation");

  return {
    status: "success",
    message: "Submitted. Status: pending moderation.",
  };
}
