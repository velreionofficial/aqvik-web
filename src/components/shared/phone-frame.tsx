import Image from "next/image";

import { cn } from "@/lib/utils";

export type PhoneFrameProps = {
  src: string;
  /** Describes what the screen shows, for screen readers and search. */
  alt: string;
  caption?: string;
  /** Only the hero screen is eager-loaded; everything else lazy-loads. */
  priority?: boolean;
  sizes?: string;
  className?: string;
};

/**
 * A real capture from the app inside a phone body with a soft shadow. The
 * captures share one aspect ratio (800 × 1346), so the screen fills exactly.
 */
export function PhoneFrame({
  src,
  alt,
  caption,
  priority = false,
  sizes = "(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 22rem",
  className,
}: PhoneFrameProps) {
  return (
    <figure className={cn("mx-auto w-full", className)}>
      <div className="glass rounded-[2.4rem] p-2 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.95),inset_0_1px_0_rgba(255,255,255,0.16)]">
        <div className="relative aspect-[400/673] overflow-hidden rounded-[1.9rem] bg-background">
          <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            quality={90}
            priority={priority}
            className="object-cover object-top"
          />
        </div>
      </div>
      {caption ? (
        <figcaption className="mt-4 text-center text-sm text-muted-dim">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
