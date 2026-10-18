/* eslint-disable @next/next/no-img-element -- a fixed-size static cover */
import { cn } from "@/lib/utils";

/** The book's cover at a 5:8 ratio, with a soft shadow like a printed book. */
export function BookCover({ src, title, className, priority = false }: { src: string; title: string; className?: string; priority?: boolean }) {
  return (
    <img
      src={src}
      alt={`${title} — book cover`}
      width={800}
      height={1280}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      className={cn("aspect-[5/8] h-auto rounded-md object-cover shadow-[0_24px_60px_-18px_rgba(255,45,61,.45),0_10px_30px_-10px_rgba(0,0,0,.9)] ring-1 ring-white/10", className)}
    />
  );
}
