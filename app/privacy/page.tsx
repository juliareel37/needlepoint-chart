import type { Metadata } from "next";
import LegalPage from "../LegalPage";
import { privacyPolicyContent } from "../legalContent";

export const metadata: Metadata = privacyPolicyContent.metadata;

export default function PrivacyPage() {
  return <LegalPage content={privacyPolicyContent} />;
}
