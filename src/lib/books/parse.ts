/**
 * Book text format. Each part is a Markdown-like file:
 *
 *   ### Page 3 — Call        starts a page (the words after the dash are its title)
 *   ## Is part ki seekh      starts a closing page (lessons)
 *   **bold**, *italic*, [link](https://…), "- " and "1. " lists, "> " quotes
 *   ---                      ignored (visual break in the source only)
 *
 *   :::call / :::videocall / :::sms / :::chat / :::message / :::dialer
 *   key: value               one field per line
 *   :::
 *
 *   :::image c1p1-bank       an illustration; shown only if the file exists
 *   alt: description
 *   :::
 *
 *   :::box news              a boxed section; its lines use the same format
 *   …
 *   :::
 *
 * Pure: no React, no file system, so it is tested directly.
 */

export type Inline =
  | { t: "text"; v: string }
  | { t: "b"; v: string }
  | { t: "i"; v: string }
  | { t: "link"; v: string; href: string };

export type ScreenKind = "call" | "videocall" | "sms" | "chat" | "message" | "dialer";
export type Tone = "red" | "green" | "sos" | "share" | "plain";

export type Block =
  | { type: "p"; text: Inline[] }
  | { type: "quote"; text: Inline[] }
  | { type: "h"; text: Inline[]; tone: Tone }
  | { type: "ul" | "ol"; items: Inline[][] }
  | { type: "screen"; kind: ScreenKind; fields: Record<string, string> }
  | { type: "image"; id: string; alt: string }
  | { type: "box"; tone: string; blocks: Block[] };

export type BookPage = { title: string; closing: boolean; blocks: Block[] };

const SCREENS: readonly ScreenKind[] = ["call", "videocall", "sms", "chat", "message", "dialer"];

/** Splits **bold**, *italic* and [text](https://…) into tokens; everything else is text. */
export function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g;
  let last = 0;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    if (m.index > last) out.push({ t: "text", v: src.slice(last, m.index) });
    if (m[1] !== undefined) out.push({ t: "b", v: m[1] });
    else if (m[2] !== undefined) out.push({ t: "i", v: m[2] });
    else out.push({ t: "link", v: m[3]!, href: m[4]! });
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ t: "text", v: src.slice(last) });
  return out;
}

const toneOf = (line: string): Tone | null => {
  if (!/^\*\*.+\*\*/.test(line)) return null;
  if (line.startsWith("**🚩")) return "red";
  if (line.startsWith("**✅")) return "green";
  if (line.startsWith("**🆘")) return "sos";
  if (line.startsWith("**💬")) return "share";
  return null;
};

/** Parses the lines of one page (or one box) into blocks. */
function parseBlocks(lines: string[]): Block[] {
  const blocks: Block[] = [];
  let para: string[] = [];
  const flush = () => {
    if (para.length) blocks.push({ type: "p", text: parseInline(para.join(" ")) });
    para = [];
  };
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();
    if (!line || line === "---") {
      flush();
      continue;
    }
    const fence = /^:::(\w+)(?:\s+(.+))?$/.exec(line);
    if (fence) {
      flush();
      const [, kind, arg] = fence;
      const inner: string[] = [];
      for (i++; i < lines.length && lines[i]!.trim() !== ":::"; i++) inner.push(lines[i]!);
      if (kind === "box") blocks.push({ type: "box", tone: arg ?? "plain", blocks: parseBlocks(inner) });
      else {
        const fields: Record<string, string> = {};
        for (const l of inner) {
          const kv = /^\s*(\w+):\s*(.*)$/.exec(l);
          if (kv) fields[kv[1]!] = kv[2]!.trim();
        }
        if (kind === "image") blocks.push({ type: "image", id: arg ?? "", alt: fields.alt ?? "" });
        else if ((SCREENS as readonly string[]).includes(kind!)) blocks.push({ type: "screen", kind: kind as ScreenKind, fields });
        else throw new Error(`Unknown block ":::${kind}"`);
      }
      continue;
    }
    const tone = toneOf(line);
    if (tone) {
      flush();
      const m = /^\*\*(.+?)\*\*(.*)$/.exec(line)!;
      blocks.push({ type: "h", text: parseInline(m[1]!), tone });
      if (m[2]!.trim()) blocks.push({ type: "p", text: parseInline(m[2]!.trim()) });
      continue;
    }
    const ul = /^-\s+(.*)$/.exec(line);
    const ol = /^\d+\.\s+(.*)$/.exec(line);
    if (ul || ol) {
      flush();
      const type = ul ? "ul" : "ol";
      const prev = blocks[blocks.length - 1];
      const item = parseInline((ul ?? ol)![1]!);
      if (prev && prev.type === type) prev.items.push(item);
      else blocks.push({ type, items: [item] });
      continue;
    }
    if (line.startsWith(">")) {
      flush();
      blocks.push({ type: "quote", text: parseInline(line.replace(/^>\s?/, "")) });
      continue;
    }
    para.push(line);
  }
  flush();
  return blocks;
}

/** Splits a part into pages at "### …" (story pages) and "## …" (closing page). */
export function parseBook(src: string): BookPage[] {
  const pages: BookPage[] = [];
  let current: { title: string; closing: boolean; lines: string[] } | null = null;
  const push = () => {
    if (current) pages.push({ title: current.title, closing: current.closing, blocks: parseBlocks(current.lines) });
  };
  for (const raw of src.split(/\r?\n/)) {
    const h3 = /^###\s+(.*)$/.exec(raw);
    const h2 = /^##\s+(.*)$/.exec(raw);
    if (h3 || h2) {
      push();
      const heading = (h3 ?? h2)![1]!.trim();
      // "Page 3 — Call" → "Call"
      const title = heading.replace(/^Page\s+\d+\s*[—–-]\s*/i, "");
      current = { title, closing: !!h2, lines: [] };
      continue;
    }
    if (current) current.lines.push(raw);
  }
  push();
  return pages;
}

/** Image ids used in a part, for checking which illustration files exist. */
export const imageIds = (pages: BookPage[]): string[] => {
  const ids: string[] = [];
  const walk = (bs: Block[]) => {
    for (const b of bs) {
      if (b.type === "image") ids.push(b.id);
      if (b.type === "box") walk(b.blocks);
    }
  };
  pages.forEach((p) => walk(p.blocks));
  return ids;
};

/** Plain text of a page, for word counts and descriptions. */
export const pageText = (p: BookPage): string => {
  const inl = (xs: Inline[]) => xs.map((x) => x.v).join("");
  const walk = (bs: Block[]): string =>
    bs
      .map((b) => {
        if (b.type === "p" || b.type === "quote" || b.type === "h") return inl(b.text);
        if (b.type === "ul" || b.type === "ol") return b.items.map(inl).join(" ");
        if (b.type === "box") return walk(b.blocks);
        if (b.type === "screen") return Object.values(b.fields).join(" ");
        return "";
      })
      .join(" ");
  return walk(p.blocks);
};
