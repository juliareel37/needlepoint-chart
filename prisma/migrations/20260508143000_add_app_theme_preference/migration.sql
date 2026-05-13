CREATE TYPE "AppThemePreference" AS ENUM ('LIGHT', 'SYSTEM', 'DARK');

ALTER TABLE "AppUser"
ADD COLUMN "themePreference" "AppThemePreference";
