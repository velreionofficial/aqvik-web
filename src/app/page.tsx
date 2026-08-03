import type { Metadata } from "next";

import { Hero } from "@/components/sections/hero";
import { BetaAccess } from "@/components/beta/beta-access";
import { Trust } from "@/components/sections/trust";
import { Features } from "@/components/sections/features";
import { WhyAqvik } from "@/components/sections/why-aqvik";
import { ProductPreview } from "@/components/sections/product-preview";
import { Roadmap } from "@/components/sections/roadmap";
import { Faq } from "@/components/sections/faq";
import { faqs } from "@/content/home";
import { siteConfig } from "@/content/site";

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} — ${siteConfig.tagline}` },
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

export default function HomePage() {
  return (
    <>
      <Hero />
      <BetaAccess />
      <Trust />
      <Features />
      <WhyAqvik />
      <ProductPreview />
      <Roadmap />
      <Faq />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
    </>
  );
}
