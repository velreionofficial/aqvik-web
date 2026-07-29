import type * as React from "react";

import { cn } from "@/lib/utils";

export type ScreenshotFrameProps = {
  /** What this slot will hold once the real capture exists. */
  label: string;
  caption?: string;
  /** `phone` for device captures, `wide` for desktop or feature stills. */
  ratio?: "phone" | "wide";
  className?: string;
  /**
   * Drop a real screenshot in here (e.g. a `next/image`) and the placeholder
   * treatment is replaced without any layout change.
   */
  children?: React.ReactNode;
};

const ratioClass: Record<NonNullable<ScreenshotFrameProps["ratio"]>, string> = {
  phone: "aspect-[9/19]",
  wide: "aspect-[16/10]",
};

/**
 * A reserved slot for product imagery. It deliberately renders no invented
 * interface — only the frame, the aspect ratio and a label describing what
 * belongs there.
 */
export function ScreenshotFrame({
  label,
  caption,
  ratio = "phone",
  className,
  children,
}: ScreenshotFrameProps) {
  return (
    <figure className={cn("group", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-hairline bg-surface",
          "shadow-raised transition-colors duration-300 ease-entrance group-hover:border-hairline-strong",
          ratioClass[ratio],
        )}
      >
        {children ?? (
          <>
            <div aria-hidden="true" className="absolute inset-0 grid-fade opacity-70" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="font-mono text-label uppercase text-muted-dim">Screen</span>
              <span className="max-w-[22ch] text-sm text-muted">{label}</span>
            </div>
          </>
        )}
      </div>
      {caption ? (
        <figcaption className="mt-4 text-sm text-muted-dim">{caption}</figcaption>
      ) : null}
    </figure>
  );
}
