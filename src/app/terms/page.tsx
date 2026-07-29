import { LegalPage } from "@/components/layout/legal-page";
import { termsAndConditions } from "@/content/legal/terms";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Terms & Conditions",
  description:
    "The terms that govern use of AQVIK Personal OS, including acceptable use, AI limitations, liability and governing law.",
  path: "/terms",
});

export default function TermsPage() {
  return <LegalPage document={termsAndConditions} />;
}
