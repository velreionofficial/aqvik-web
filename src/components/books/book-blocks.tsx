/* eslint-disable @next/next/no-img-element -- book illustrations are plain static files with fixed sizes */
import { Screen } from "@/components/books/screens";
import type { Block, Inline, Tone } from "@/lib/books/parse";
import { cn } from "@/lib/utils";

function Text({ xs }: { xs: Inline[] }) {
  return (
    <>
      {xs.map((x, i) => {
        if (x.t === "b") return <strong key={i} className="font-semibold text-foreground">{x.v}</strong>;
        if (x.t === "i") return <em key={i} className="text-muted">{x.v}</em>;
        if (x.t === "link")
          return (
            <a key={i} href={x.href} target="_blank" rel="noopener noreferrer" className="text-primary-soft underline-offset-4 hover:underline">
              {x.v}
            </a>
          );
        return <span key={i}>{x.v}</span>;
      })}
    </>
  );
}

const TONE: Record<Tone, string> = {
  red: "text-[#FF8A94]",
  green: "text-[#4ADE80]",
  sos: "text-warning",
  share: "text-primary-soft",
  plain: "text-foreground",
};

export function Blocks({ blocks, images }: { blocks: Block[]; images: Record<string, string | null> }) {
  return (
    <>
      {blocks.map((b, i) => {
        switch (b.type) {
          case "p":
            return <p key={i}><Text xs={b.text} /></p>;
          case "quote":
            return <blockquote key={i} className="border-l-2 border-primary/50 pl-4 italic text-muted"><Text xs={b.text} /></blockquote>;
          case "h":
            return <h3 key={i} className={cn("!mt-8 text-[1.0625rem] font-semibold", TONE[b.tone])}><Text xs={b.text} /></h3>;
          case "ul":
            return <ul key={i} className="list-disc space-y-1.5 pl-5">{b.items.map((it, j) => <li key={j}><Text xs={it} /></li>)}</ul>;
          case "ol":
            return <ol key={i} className="list-decimal space-y-1.5 pl-5">{b.items.map((it, j) => <li key={j}><Text xs={it} /></li>)}</ol>;
          case "screen":
            return <Screen key={i} kind={b.kind} f={b.fields} />;
          case "image": {
            const src = images[b.id];
            if (!src) return null;
            return (
              <figure key={i} className="!my-7 overflow-hidden rounded-2xl border border-white/10">
                <img src={src} alt={b.alt} loading="lazy" decoding="async" className="h-auto w-full" />
              </figure>
            );
          }
          case "box":
            return (
              <aside key={i} className={cn("glass !my-7 space-y-3 rounded-2xl p-5 text-[0.9375rem]", b.tone === "news" && "border border-warning/30")}>
                <Blocks blocks={b.blocks} images={images} />
              </aside>
            );
        }
      })}
    </>
  );
}
