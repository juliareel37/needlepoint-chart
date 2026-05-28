import { readFileSync } from "node:fs";
import { join } from "node:path";

const disposableEmailDomains = readFileSync(
  join(process.cwd(), "lib/waitlist/disposableEmailDomains.txt"),
  "utf8",
)
  .split(/\r?\n/)
  .map((domain) => domain.trim().toLowerCase())
  .filter((domain) => domain.length > 0 && !domain.startsWith("#"));

const disposableEmailDomainSet: ReadonlySet<string> = new Set(disposableEmailDomains);

export function isDisposableEmailDomain(domain: string) {
  const normalizedDomain = domain.trim().toLowerCase();
  if (!normalizedDomain) {
    return false;
  }

  if (disposableEmailDomainSet.has(normalizedDomain)) {
    return true;
  }

  return disposableEmailDomains.some((blockedDomain) =>
    normalizedDomain.endsWith(`.${blockedDomain}`),
  );
}
