-- CreateTable
CREATE TABLE "EditorDesign" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "gridWidth" INTEGER NOT NULL,
    "gridHeight" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EditorDesign_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditorDesign_userId_idx" ON "EditorDesign"("userId");

-- CreateIndex
CREATE INDEX "EditorDesign_updatedAt_idx" ON "EditorDesign"("updatedAt");
