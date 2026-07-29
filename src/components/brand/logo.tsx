import Image from "next/image";

import { cn } from "@/lib/utils";

export type LogoProps = {
  className?: string;
  /** Rendered size of the mark in pixels. */
  size?: number;
  /** Show the AQVIK wordmark beside the mark. */
  showWordmark?: boolean;
  wordmarkClassName?: string;
  /** Set on above-the-fold instances so the mark is not lazy-loaded. */
  priority?: boolean;
};

/**
 * The single shared logo for the whole site — header, footer and hero all
 * render this component. The asset is the official AQVIK app icon used on the
 * Play Store listing, so web and store branding stay identical.
 */
export function Logo({
  className,
  size = 28,
  showWordmark = true,
  wordmarkClassName,
  priority = false,
}: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src="/brand/aqvik-logo.png"
        alt={showWordmark ? "" : "AQVIK"}
        width={size}
        height={size}
        priority={priority}
        className="shrink-0"
      />
      {showWordmark ? (
        <span
          className={cn(
            "text-[0.9375rem] font-semibold tracking-[0.22em] text-foreground",
            wordmarkClassName,
          )}
        >
          AQVIK
        </span>
      ) : null}
    </span>
  );
}
