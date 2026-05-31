ALTER TABLE "AppUser"
ADD COLUMN "subscribedToPromotions" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "promotionsUnsubscribedAt" TIMESTAMP(3);
