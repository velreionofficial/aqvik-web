import { LegalPage } from "@/components/layout/legal-page";
import { privacyPolicy } from "@/content/legal/privacy";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Privacy Policy",
  description:
    "How AQVIK collects, uses, stores and protects personal and financial information, and the rights you have over it.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return <LegalPage document={privacyPolicy} />;
}
