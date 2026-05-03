CREATE TABLE "AppUser" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppUser_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuthIdentity" (
    "id" TEXT NOT NULL,
    "appUserId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerUserId" TEXT NOT NULL,
    "email" TEXT,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthIdentity_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "EditorDesign" ADD COLUMN "appUserId" TEXT;

INSERT INTO "AppUser" ("id", "createdAt", "updatedAt")
SELECT DISTINCT
    'appusr_' || md5("userId"),
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "EditorDesign"
WHERE "userId" IS NOT NULL;

INSERT INTO "AuthIdentity" (
    "id",
    "appUserId",
    "provider",
    "providerUserId",
    "createdAt",
    "updatedAt"
)
SELECT DISTINCT
    'authid_' || md5('legacy_editor_design_user_id:' || "userId"),
    'appusr_' || md5("userId"),
    'legacy_editor_design_user_id',
    "userId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "EditorDesign"
WHERE "userId" IS NOT NULL;

UPDATE "EditorDesign"
SET "appUserId" = 'appusr_' || md5("userId")
WHERE "appUserId" IS NULL;

ALTER TABLE "EditorDesign" ALTER COLUMN "appUserId" SET NOT NULL;

CREATE UNIQUE INDEX "AuthIdentity_provider_providerUserId_key" ON "AuthIdentity"("provider", "providerUserId");
CREATE INDEX "AuthIdentity_appUserId_idx" ON "AuthIdentity"("appUserId");
CREATE INDEX "AuthIdentity_email_idx" ON "AuthIdentity"("email");
CREATE INDEX "EditorDesign_appUserId_idx" ON "EditorDesign"("appUserId");

ALTER TABLE "AuthIdentity"
ADD CONSTRAINT "AuthIdentity_appUserId_fkey"
FOREIGN KEY ("appUserId") REFERENCES "AppUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EditorDesign"
ADD CONSTRAINT "EditorDesign_appUserId_fkey"
FOREIGN KEY ("appUserId") REFERENCES "AppUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
