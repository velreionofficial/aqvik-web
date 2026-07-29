import { LegalPage } from "@/components/layout/legal-page";
import { deleteAccount } from "@/content/legal/delete-account";
import { createMetadata } from "@/lib/seo";

export const metadata = createMetadata({
  title: "Delete Your AQVIK Account",
  description:
    "How to permanently delete your AQVIK account and financial records, from inside the app or by email, and exactly what is deleted and what is retained.",
  path: "/delete-account",
});

export default function DeleteAccountPage() {
  return <LegalPage document={deleteAccount} />;
}
