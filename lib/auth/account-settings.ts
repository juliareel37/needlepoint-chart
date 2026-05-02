export type AccountSettingsAuthMethod = "google_oauth" | "email_password";

export interface AccountSettingsContext {
  authMethod: AccountSettingsAuthMethod;
  // authMethodHint: string;
  authMethodLabel: string;
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

  const authMethod: AccountSettingsAuthMethod = normalizedProviderIds.includes("google")
    ? "google_oauth"
    : "email_password";

  if (authMethod === "google_oauth") {
    return {
      authMethod,
      // authMethodHint: "You're signed in with Google, so sign-in credentials are managed there.",
      authMethodLabel: "Google OAuth",
      providerIds: normalizedProviderIds,
    };
  }

  return {
    authMethod,
    // authMethodHint: "You're using email and password managed directly by this app.",
    authMethodLabel: "Email + password",
    providerIds: normalizedProviderIds,
  };
}
