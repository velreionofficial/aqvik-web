import Image from "next/image";

import { cn } from "@/lib/utils";

export type ProductScreenshotProps = {
  src: string;
  /** Describes what the screen shows, for screen readers and search. */
  alt: string;
  caption?: string;
  /** Eager-load the first screenshot; everything below the fold lazy-loads. */
  priority?: boolean;
  className?: string;
};

/**
 * A real capture from the AQVIK Personal OS build, presented in the site's
 * device treatment. All assets share one aspect ratio (800 × 1346), so the
 * image fills the frame exactly — nothing is stretched or letterboxed.
 */
export function ProductScreenshot({
  src,
  alt,
  caption,
  priority = false,
  className,
}: ProductScreenshotProps) {
  return (
    <figure className={cn("group", className)}>
      <div
        className={cn(
          "relative aspect-[400/673] overflow-hidden rounded-3xl border border-hairline bg-surface",
          "shadow-raised transition-colors duration-300 ease-entrance group-hover:border-hairline-strong",
        )}
      >
        <Image
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 640px) 92vw, (max-width: 1024px) 46vw, 30vw"
          quality={90}
          priority={priority}
          className="object-cover object-top"
        />
      </div>
      {caption ? (
        <figcaption className="mt-4 text-sm text-muted-dim">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
