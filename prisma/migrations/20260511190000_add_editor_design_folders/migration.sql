-- CreateTable
CREATE TABLE "EditorDesignFolder" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorDesignFolder_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "EditorDesign" ADD COLUMN "folderId" TEXT;

-- CreateIndex
CREATE INDEX "EditorDesignFolder_appUserId_idx" ON "EditorDesignFolder"("appUserId");

-- CreateIndex
CREATE UNIQUE INDEX "EditorDesignFolder_appUserId_name_key" ON "EditorDesignFolder"("appUserId", "name");

-- CreateIndex
CREATE INDEX "EditorDesign_folderId_idx" ON "EditorDesign"("folderId");

-- CreateIndex
CREATE INDEX "EditorDesign_appUserId_folderId_deletedAt_updatedAt_idx" ON "EditorDesign"("appUserId", "folderId", "deletedAt", "updatedAt");

-- AddForeignKey
ALTER TABLE "EditorDesignFolder" ADD CONSTRAINT "EditorDesignFolder_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "AppUser"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorDesign" ADD CONSTRAINT "EditorDesign_folderId_fkey" FOREIGN KEY ("folderId") REFERENCES "EditorDesignFolder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
