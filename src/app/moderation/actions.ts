"use server";

import { SubmissionState } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { getAuthSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const moderateSchema = z.object({
  submissionId: z.string().min(1),
  nextState: z.enum(["APPROVED", "REJECTED", "REMOVED"]),
  reason: z.string().trim().max(500).optional(),
});

export async function moderateSubmissionAction(formData: FormData) {
  const session = await getAuthSession();

  if (!session?.user?.id || session.user.role !== "MODERATOR") {
    throw new Error("Unauthorized.");
  }

  const parsed = moderateSchema.safeParse({
    submissionId: formData.get("submissionId"),
    nextState: formData.get("nextState"),
    reason: formData.get("reason") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Invalid moderation payload.");
  }

  const submission = await prisma.submission.findUnique({
    where: { id: parsed.data.submissionId },
    select: { id: true, state: true },
  });

  if (!submission) {
    throw new Error("Submission not found.");
  }

  const nextState = parsed.data.nextState as SubmissionState;
  const reason = parsed.data.reason?.length ? parsed.data.reason : null;

  await prisma.$transaction([
    prisma.submission.update({
      where: { id: submission.id },
      data: {
        state: nextState,
        moderationReason: reason,
        lastModeratedAt: new Date(),
        lastModeratedById: session.user.id,
        lastModeratedByName: session.user.githubLogin,
      },
    }),
    prisma.moderationLog.create({
      data: {
        submissionId: submission.id,
        moderatorId: session.user.id,
        fromState: submission.state,
        toState: nextState,
        reason,
      },
    }),
  ]);

  revalidatePath("/");
  revalidatePath("/submit");
  revalidatePath("/moderation");
}
