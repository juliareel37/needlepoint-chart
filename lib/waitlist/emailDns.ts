import { resolveMx } from "node:dns/promises";

function getEmailDomain(email: string) {
  return email.split("@").pop()?.trim().toLowerCase() ?? "";
}

export async function validateEmailMxRecords(email: string) {
  const domain = getEmailDomain(email);
  if (!domain) {
    return false;
  }

  try {
    const records = await resolveMx(domain);
    return records.length > 0;
  } catch {
    return false;
  }
}
