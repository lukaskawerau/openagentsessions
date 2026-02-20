-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('USER', 'MODERATOR');

-- CreateEnum
CREATE TYPE "public"."SubmissionState" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'REMOVED');

-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "githubId" TEXT NOT NULL,
    "githubLogin" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "image" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Submission" (
    "id" TEXT NOT NULL,
    "gistId" TEXT NOT NULL,
    "gistUrl" TEXT NOT NULL,
    "gistOwnerId" TEXT NOT NULL,
    "gistOwnerLogin" TEXT NOT NULL,
    "gistDescription" TEXT,
    "gistVersion" TEXT NOT NULL,
    "gistUpdatedAt" TIMESTAMP(3) NOT NULL,
    "lastCheckedAt" TIMESTAMP(3) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "state" "public"."SubmissionState" NOT NULL DEFAULT 'PENDING',
    "moderationReason" TEXT,
    "submitterId" TEXT NOT NULL,
    "lastModeratedById" TEXT,
    "lastModeratedByName" TEXT,
    "lastModeratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ModerationLog" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "moderatorId" TEXT NOT NULL,
    "fromState" "public"."SubmissionState" NOT NULL,
    "toState" "public"."SubmissionState" NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "public"."User"("githubId");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubLogin_key" ON "public"."User"("githubLogin");

-- CreateIndex
CREATE UNIQUE INDEX "Submission_gistId_key" ON "public"."Submission"("gistId");

-- CreateIndex
CREATE INDEX "Submission_state_createdAt_idx" ON "public"."Submission"("state", "createdAt");

-- CreateIndex
CREATE INDEX "Submission_submitterId_createdAt_idx" ON "public"."Submission"("submitterId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationLog_submissionId_createdAt_idx" ON "public"."ModerationLog"("submissionId", "createdAt");

-- CreateIndex
CREATE INDEX "ModerationLog_moderatorId_createdAt_idx" ON "public"."ModerationLog"("moderatorId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."Submission" ADD CONSTRAINT "Submission_submitterId_fkey" FOREIGN KEY ("submitterId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationLog" ADD CONSTRAINT "ModerationLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "public"."Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."ModerationLog" ADD CONSTRAINT "ModerationLog_moderatorId_fkey" FOREIGN KEY ("moderatorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

