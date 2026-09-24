import { Container } from "@/components/layout/container";
import { proofPoints } from "@/content/home";

/** Three trust facts directly under the hero. */
export function ProofStrip() {
  return (
    <section aria-label="Why you can rely on AQVIK">
      <Container>
        <dl className="glass my-6 grid divide-y divide-hairline rounded-2xl px-6 sm:my-8 sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:px-0">
          {proofPoints.map((point) => (
            <div key={point.title} className="py-6 sm:px-8 sm:py-8">
              <dt className="text-[1.0625rem] font-medium text-foreground">{point.title}</dt>
              <dd className="mt-2 text-[0.9375rem] leading-relaxed text-muted">
                {point.description}
              </dd>
            </div>
          ))}
        </dl>
      </Container>
    </section>
  );
}
