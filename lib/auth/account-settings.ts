export type AccountSettingsAuthMethod = "google_oauth" | "email_password";

export interface AccountSettingsContext {
  authMethod: AccountSettingsAuthMethod;
  authMethodLabel: string;
  hasGoogleOAuth: boolean;
  hasEmailPassword: boolean;
  providerIds: string[];
}

export function getAccountSettingsContextFromProviderIds(
  providerIds: string[],
): AccountSettingsContext {
  const normalizedProviderIds = Array.from(
    new Set(
      providerIds
        .map((providerId) => providerId.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
  const hasGoogleOAuth = normalizedProviderIds.includes("google");
  const hasEmailPassword = normalizedProviderIds.includes("credential");

  const authMethod: AccountSettingsAuthMethod = hasGoogleOAuth
    ? "google_oauth"
    : "email_password";

  if (hasGoogleOAuth && hasEmailPassword) {
    return {
      authMethod,
      authMethodLabel: "Google OAuth + email/password",
      hasGoogleOAuth,
      hasEmailPassword,
      providerIds: normalizedProviderIds,
    };
  }

  if (authMethod === "google_oauth") {
    return {
      authMethod,
      authMethodLabel: "Google OAuth",
      hasGoogleOAuth,
      hasEmailPassword,
      providerIds: normalizedProviderIds,
    };
  }

  return {
    authMethod,
    authMethodLabel: "Email + password",
    hasGoogleOAuth,
    hasEmailPassword,
    providerIds: normalizedProviderIds,
  };
}
