import type * as React from "react";
import { FileText, Mic, Phone, PhoneOff, Video } from "lucide-react";

import type { ScreenKind } from "@/lib/books/parse";
import { cn } from "@/lib/utils";

/**
 * Phone screens drawn in HTML, not images: the text stays readable, searchable and translatable.
 * Names are fictional; no real app, bank or agency branding.
 */
function PhoneShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <figure className={cn("mx-auto my-6 w-full max-w-[19rem] overflow-hidden rounded-[2rem] border-[6px] border-[#1E1E2A] bg-[#0D0D14] shadow-[0_20px_60px_-20px_rgba(0,0,0,.9)]", className)}>
      {children}
    </figure>
  );
}

function Flag({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <figcaption className="border-t border-[#FF2D3D]/40 bg-[#FF2D3D]/10 px-4 py-3 text-[0.8125rem] leading-snug text-[#FF9AA2]">
      <span aria-hidden="true">🚩 </span>
      {text}
    </figcaption>
  );
}

export function Screen({ kind, f }: { kind: ScreenKind; f: Record<string, string> }) {
  switch (kind) {
    case "call":
      return (
        <PhoneShell>
          <div className="px-5 pb-6 pt-7 text-center">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted-dim">Incoming call</p>
            <div aria-hidden="true" className="mx-auto mt-5 grid size-16 place-items-center rounded-full bg-white/10 text-2xl">📦</div>
            <p className="mt-4 text-lg font-semibold text-foreground">{f.name}</p>
            <p className="mt-1 font-mono text-sm text-muted">{f.number}</p>
            {f.meta ? <p className="mt-0.5 text-xs text-muted-dim">{f.meta}</p> : null}
            <div aria-hidden="true" className="mt-7 flex justify-center gap-16">
              <span className="grid size-12 place-items-center rounded-full bg-[#EF4444]"><PhoneOff className="size-5 text-white" /></span>
              <span className="grid size-12 place-items-center rounded-full bg-[#22C55E]"><Phone className="size-5 text-white" /></span>
            </div>
          </div>
          <Flag text={f.flag} />
        </PhoneShell>
      );
    case "videocall":
      return (
        <PhoneShell>
          <div className="bg-gradient-to-b from-[#15151F] to-[#1A0608] px-5 pb-6 pt-7 text-center">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-muted-dim">VidCall · video call</p>
            <div aria-hidden="true" className="mx-auto mt-5 size-20 rounded-full border-2 border-[#FF2D3D] bg-[#202030] shadow-[0_0_30px_rgba(255,45,61,.45)]" />
            <p className="mt-4 text-lg font-semibold text-foreground">{f.name}</p>
            <p className="mt-1 text-xs text-muted">{f.number}</p>
            <div aria-hidden="true" className="mt-7 flex justify-center gap-16">
              <span className="grid size-12 place-items-center rounded-full bg-white/10"><PhoneOff className="size-5 text-muted" /></span>
              <span className="grid size-12 place-items-center rounded-full bg-[#22C55E]"><Video className="size-5 text-white" /></span>
            </div>
          </div>
          <Flag text={f.flag} />
        </PhoneShell>
      );
    case "sms":
      return (
        <PhoneShell>
          <div className="px-4 pb-5 pt-5">
            <p className="text-center text-xs text-muted-dim">{f.from}</p>
            <p className="mt-3 rounded-2xl rounded-tl-md bg-white/10 px-4 py-3 text-[0.875rem] leading-relaxed text-foreground">{f.text}</p>
          </div>
          <Flag text={f.flag} />
        </PhoneShell>
      );
    case "chat":
      return (
        <PhoneShell>
          <div className="bg-[#0F1A17] px-4 pb-5 pt-4">
            <p className="text-center text-xs text-muted-dim">ChatBox</p>
            <div className="mt-3 rounded-2xl rounded-tl-md bg-[#1C2B26] p-3">
              {f.file ? (
                <p className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 text-[0.8125rem] text-foreground">
                  <FileText aria-hidden="true" className="size-4 shrink-0 text-[#FF8A94]" />
                  <span className="truncate">{f.file}</span>
                </p>
              ) : null}
              {f.text ? <p className="mt-2 text-[0.8125rem] italic leading-relaxed text-[#D7E4DF]">&ldquo;{f.text}&rdquo;</p> : null}
              {f.note ? <p className="mt-2 text-[0.75rem] text-muted-dim">({f.note})</p> : null}
            </div>
          </div>
          <Flag text={f.flag} />
        </PhoneShell>
      );
    case "message":
      return (
        <PhoneShell>
          <div className="px-4 pb-5 pt-4">
            <p className="text-center text-xs text-muted-dim">{f.from}</p>
            <p className="mt-3 rounded-2xl rounded-tl-md bg-[#1F2A44] px-4 py-3 text-[0.875rem] leading-relaxed text-foreground">{f.text}</p>
          </div>
          <Flag text={f.flag} />
        </PhoneShell>
      );
    case "dialer":
      return (
        <PhoneShell className="border-[#22C55E]/60">
          <div className="px-5 pb-7 pt-8 text-center">
            <p className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-[#4ADE80]">Calling…</p>
            <p className="mt-4 font-mono text-5xl font-semibold tracking-[0.15em] text-foreground">{f.number}</p>
            {f.label ? <p className="mt-2 text-sm text-muted">{f.label}</p> : null}
            <span aria-hidden="true" className="mx-auto mt-7 grid size-12 place-items-center rounded-full bg-[#EF4444]"><PhoneOff className="size-5 text-white" /></span>
          </div>
        </PhoneShell>
      );
    default:
      return (
        <PhoneShell>
          <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted"><Mic className="size-4" /> {Object.values(f).join(" · ")}</p>
        </PhoneShell>
      );
  }
}
