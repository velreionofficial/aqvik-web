import type { Metadata } from "next";

import { Hero } from "@/components/sections/hero";
import { ProofStrip } from "@/components/sections/proof-strip";
import { SharedMoney } from "@/components/sections/shared-money";
import { Features } from "@/components/sections/features";
import { ProductPreview } from "@/components/sections/product-preview";
import { Trust } from "@/components/sections/trust";
import { Roadmap } from "@/components/sections/roadmap";
import { BetaAccess } from "@/components/beta/beta-access";
import { Founder } from "@/components/sections/founder";
import { Faq } from "@/components/sections/faq";
import { FinalCta } from "@/components/sections/final-cta";
import { faqs } from "@/content/home";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: siteConfig.homeTitle },
  description: siteConfig.description,
  alternates: { canonical: "/" },
};

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

/** Section order from the homepage brief (24 September 2026). */
export default function HomePage() {
  return (
    <>
      <Hero />
      <ProofStrip />
      <SharedMoney />
      <Features />
      <ProductPreview />
      <Trust />
      <Roadmap />
      <BetaAccess />
      <Founder />
      <Faq />
      <FinalCta />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </>
  );
}
