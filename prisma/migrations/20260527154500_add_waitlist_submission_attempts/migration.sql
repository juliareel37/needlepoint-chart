-- CreateEnum
CREATE TYPE "WaitlistSubmissionAttemptStatus" AS ENUM ('APPROVED', 'REJECTED', 'DUPLICATE');

-- CreateTable
CREATE TABLE "WaitlistSubmissionAttempt" (
    "id" TEXT NOT NULL,
    "status" "WaitlistSubmissionAttemptStatus" NOT NULL,
    "rejectionReason" TEXT,
    "email" TEXT,
    "normalizedEmail" TEXT,
    "experienceLevel" TEXT,
    "currentTools" TEXT,
    "freeformResponse" TEXT,
    "ipAddressHash" TEXT,
    "userAgent" TEXT,
    "waitlistApplicationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitlistSubmissionAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaitlistSubmissionAttempt_status_createdAt_idx" ON "WaitlistSubmissionAttempt"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistSubmissionAttempt_normalizedEmail_idx" ON "WaitlistSubmissionAttempt"("normalizedEmail");

-- CreateIndex
CREATE INDEX "WaitlistSubmissionAttempt_ipAddressHash_createdAt_idx" ON "WaitlistSubmissionAttempt"("ipAddressHash", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistSubmissionAttempt_waitlistApplicationId_idx" ON "WaitlistSubmissionAttempt"("waitlistApplicationId");

-- AddForeignKey
ALTER TABLE "WaitlistSubmissionAttempt" ADD CONSTRAINT "WaitlistSubmissionAttempt_waitlistApplicationId_fkey" FOREIGN KEY ("waitlistApplicationId") REFERENCES "WaitlistApplication"("id") ON DELETE SET NULL ON UPDATE CASCADE;
