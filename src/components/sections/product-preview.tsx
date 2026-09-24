import { Section } from "@/components/layout/section";
import { PhoneFrame } from "@/components/shared/phone-frame";
import { productScreens, screensCopy } from "@/content/home";

/**
 * Horizontal, swipeable row on mobile (scroll-snap, no auto-play); a grid on
 * larger screens. Every screenshot below the hero lazy-loads.
 */
export function ProductPreview() {
  return (
    <Section id="screens" title={screensCopy.heading} description={screensCopy.line}>
      <ul
        aria-label="App screenshots"
        tabIndex={0}
        className="-mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-8 sm:overflow-visible sm:px-0 sm:pb-0"
      >
        {productScreens.map((screen) => (
          <li key={screen.src} className="w-[68vw] max-w-[17rem] shrink-0 snap-center sm:w-auto sm:max-w-none">
            <PhoneFrame
              src={screen.src}
              alt={screen.alt}
              caption={screen.caption}
              sizes="(max-width: 640px) 68vw, (max-width: 1024px) 30vw, 18rem"
            />
          </li>
        ))}
      </ul>
    </Section>
  );
}
