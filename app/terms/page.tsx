import type { Metadata } from "next";
import LegalPage from "../LegalPage";
import { termsContent } from "../legalContent";

export const metadata: Metadata = termsContent.metadata;

export default function TermsPage() {
  return <LegalPage content={termsContent} />;
}
