const DISABLED_VALUES = new Set(["0", "false", "off", "no"]);

export function isWipVersioningEnabled() {
  const raw = process.env.WIP_VERSIONING_ENABLED;
  if (raw == null) return true;
  return !DISABLED_VALUES.has(raw.trim().toLowerCase());
}
