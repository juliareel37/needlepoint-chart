export function isWaitlistRateLimitDisabled() {
  return process.env.WAITLIST_RATE_LIMIT_DISABLED === "true";
}
