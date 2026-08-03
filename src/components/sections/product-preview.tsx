import { Section } from "@/components/layout/section";
import { Reveal } from "@/components/motion/reveal";
import { ProductScreenshot } from "@/components/shared/product-screenshot";
import { productScreens } from "@/content/home";

export function ProductPreview() {
  return (
    <Section
      id="preview"
      label="Product"
      title="The app as it stands today"
      description="Screenshots from the current AQVIK Personal OS build, not renders. It is still in beta, so the interface will keep changing before public release."
    >
      <div className="grid gap-6 sm:grid-cols-3">
        {productScreens.map((screen, index) => (
          <Reveal key={screen.src} delay={Math.min(index, 2) * 0.07}>
            <ProductScreenshot
              src={screen.src}
              alt={screen.alt}
              caption={screen.caption}
              priority={index === 0}
            />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
