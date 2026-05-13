ALTER TABLE "EditorDesign"
ADD COLUMN "deletedAt" TIMESTAMP(3),
ADD COLUMN "purgeAfterAt" TIMESTAMP(3);

CREATE INDEX "EditorDesign_appUserId_deletedAt_updatedAt_idx"
ON "EditorDesign"("appUserId", "deletedAt", "updatedAt");

CREATE INDEX "EditorDesign_deletedAt_purgeAfterAt_idx"
ON "EditorDesign"("deletedAt", "purgeAfterAt");
