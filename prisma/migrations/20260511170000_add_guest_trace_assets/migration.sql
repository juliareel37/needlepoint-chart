CREATE TABLE "GuestTraceAsset" (
    "id" TEXT NOT NULL,
    "guestDraftId" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "previewUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "byteSize" INTEGER,
    "mimeType" TEXT,
    "imageWidth" INTEGER,
    "imageHeight" INTEGER,
    "claimedDesignId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuestTraceAsset_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "GuestTraceAsset_originalUrl_key" ON "GuestTraceAsset"("originalUrl");
CREATE UNIQUE INDEX "GuestTraceAsset_previewUrl_key" ON "GuestTraceAsset"("previewUrl");
CREATE UNIQUE INDEX "GuestTraceAsset_thumbnailUrl_key" ON "GuestTraceAsset"("thumbnailUrl");

CREATE INDEX "GuestTraceAsset_guestDraftId_idx" ON "GuestTraceAsset"("guestDraftId");
CREATE INDEX "GuestTraceAsset_expiresAt_idx" ON "GuestTraceAsset"("expiresAt");
CREATE INDEX "GuestTraceAsset_claimedDesignId_idx" ON "GuestTraceAsset"("claimedDesignId");
CREATE INDEX "GuestTraceAsset_claimedAt_idx" ON "GuestTraceAsset"("claimedAt");

ALTER TABLE "GuestTraceAsset"
ADD CONSTRAINT "GuestTraceAsset_claimedDesignId_fkey"
FOREIGN KEY ("claimedDesignId") REFERENCES "EditorDesign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
