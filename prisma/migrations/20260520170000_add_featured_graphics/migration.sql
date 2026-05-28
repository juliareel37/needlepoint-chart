CREATE TABLE "FeaturedGraphic" (
    "id" TEXT NOT NULL,
    "iconId" TEXT NOT NULL,
    "updatedByEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FeaturedGraphic_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FeaturedGraphic_iconId_key" ON "FeaturedGraphic"("iconId");
