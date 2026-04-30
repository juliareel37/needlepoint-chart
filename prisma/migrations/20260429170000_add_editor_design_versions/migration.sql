-- AlterTable
ALTER TABLE "EditorDesign"
ADD COLUMN     "lastSaveSource" "SaveSource",
ADD COLUMN     "lastVersionAt" TIMESTAMP(3),
ADD COLUMN     "lastVersionHash" TEXT;

-- CreateTable
CREATE TABLE "EditorDesignVersion" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "dataHash" TEXT NOT NULL,
    "saveSource" "SaveSource",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorDesignVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditorDesignVersion_designId_idx" ON "EditorDesignVersion"("designId");

-- CreateIndex
CREATE INDEX "EditorDesignVersion_designId_createdAt_idx" ON "EditorDesignVersion"("designId", "createdAt");

-- AddForeignKey
ALTER TABLE "EditorDesignVersion" ADD CONSTRAINT "EditorDesignVersion_designId_fkey" FOREIGN KEY ("designId") REFERENCES "EditorDesign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
