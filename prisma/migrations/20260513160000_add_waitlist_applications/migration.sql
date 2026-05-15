-- CreateEnum
CREATE TYPE "WaitlistApplicationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "WaitlistApplication" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "WaitlistApplicationStatus" NOT NULL DEFAULT 'PENDING',
    "experienceLevel" TEXT,
    "currentTools" TEXT,
    "freeformResponse" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedBy" TEXT,
    "inviteToken" TEXT,
    "inviteTokenExpiresAt" TIMESTAMP(3),
    "accountCreatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitlistApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistApplication_email_key" ON "WaitlistApplication"("email");

-- CreateIndex
CREATE UNIQUE INDEX "WaitlistApplication_inviteToken_key" ON "WaitlistApplication"("inviteToken");

-- CreateIndex
CREATE INDEX "WaitlistApplication_status_createdAt_idx" ON "WaitlistApplication"("status", "createdAt");

-- CreateIndex
CREATE INDEX "WaitlistApplication_inviteTokenExpiresAt_idx" ON "WaitlistApplication"("inviteTokenExpiresAt");
