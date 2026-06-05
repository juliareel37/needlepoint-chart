-- CreateTable
CREATE TABLE "EditorBugReport" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT,
    "editorDesignId" TEXT,
    "source" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "formVersion" TEXT,
    "answers" JSONB NOT NULL,
    "context" JSONB,
    "clientMetadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EditorBugReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EditorBugReport_appUserId_createdAt_idx" ON "EditorBugReport"("appUserId", "createdAt");

-- CreateIndex
CREATE INDEX "EditorBugReport_editorDesignId_createdAt_idx" ON "EditorBugReport"("editorDesignId", "createdAt");

-- CreateIndex
CREATE INDEX "EditorBugReport_source_createdAt_idx" ON "EditorBugReport"("source", "createdAt");

-- CreateIndex
CREATE INDEX "EditorBugReport_formId_createdAt_idx" ON "EditorBugReport"("formId", "createdAt");

-- CreateIndex
CREATE INDEX "EditorBugReport_createdAt_idx" ON "EditorBugReport"("createdAt");

-- AddForeignKey
ALTER TABLE "EditorBugReport" ADD CONSTRAINT "EditorBugReport_appUserId_fkey" FOREIGN KEY ("appUserId") REFERENCES "AppUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EditorBugReport" ADD CONSTRAINT "EditorBugReport_editorDesignId_fkey" FOREIGN KEY ("editorDesignId") REFERENCES "EditorDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
