-- Baseline migration for the pre-existing WIP persistence schema.
-- This migration is intended to be marked as already applied with:
--   npx prisma migrate resolve --applied 20260416_baseline_existing_schema
-- so Prisma Migrate can adopt the existing database without resetting it.

-- CreateEnum
CREATE TYPE "SaveSource" AS ENUM ('MANUAL', 'AUTOSAVE', 'RESTORE');

-- CreateTable
CREATE TABLE "PatternDraft" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "lastSaveSource" "SaveSource",
    "lastVersionAt" TIMESTAMP(3),
    "lastVersionHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PatternDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PatternVersion" (
    "id" TEXT NOT NULL,
    "draftId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "dataHash" TEXT NOT NULL,
    "saveSource" "SaveSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PatternVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PatternDraft_userId_idx" ON "PatternDraft"("userId");

-- CreateIndex
CREATE INDEX "PatternVersion_draftId_idx" ON "PatternVersion"("draftId");

-- AddForeignKey
ALTER TABLE "PatternVersion"
ADD CONSTRAINT "PatternVersion_draftId_fkey"
FOREIGN KEY ("draftId") REFERENCES "PatternDraft"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
