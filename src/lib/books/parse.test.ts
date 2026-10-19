import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { digitalThugLife } from "../../content/books/index.ts";
import { imageIds, pageText, parseBook, parseInline } from "./parse.ts";

test("Inline bold, italic and links", () => {
  assert.deepEqual(parseInline("a **b** *c* [d](https://x.in/e)"), [
    { t: "text", v: "a " },
    { t: "b", v: "b" },
    { t: "text", v: " " },
    { t: "i", v: "c" },
    { t: "text", v: " " },
    { t: "link", v: "d", href: "https://x.in/e" },
  ]);
});

test("Pages, screens, images, lists, tone headings and boxes", () => {
  const pages = parseBook(`### Page 1 — Call
Line one
continues here.

:::call
name: SwiftParcel
number: +91 22
:::

:::image c1-x
alt: An image
:::

---

## Is part ki seekh

**🚩 Chaal**
1. One
2. Two
**🆘 Agar ho jaye**
- 1930

:::box news
**📰 Asli**
- fact
:::`);
  assert.equal(pages.length, 2);
  assert.deepEqual(pages.map((p) => [p.title, p.closing]), [["Call", false], ["Is part ki seekh", true]]);
  const [a, b] = pages;
  assert.deepEqual(a!.blocks.map((x) => x.type), ["p", "screen", "image"]);
  assert.deepEqual(a!.blocks[1], { type: "screen", kind: "call", fields: { name: "SwiftParcel", number: "+91 22" } });
  assert.deepEqual(b!.blocks.map((x) => (x.type === "h" ? `h:${x.tone}` : x.type)), ["h:red", "ol", "h:sos", "ul", "box"]);
  assert.deepEqual(imageIds(pages), ["c1-x"]);
  assert.throws(() => parseBook("### P\n:::weird\n:::"), /Unknown block/);
});

const read = (file: string) => readFileSync(join(process.cwd(), "src", "content", "books", file), "utf8");
const screensOf = (pages: ReturnType<typeof parseBook>) => pages.flatMap((pg) => pg.blocks.filter((b) => b.type === "screen").map((b) => (b.type === "screen" ? b.kind : "")));

test("Every published part parses, has pages, screens and a closing section", () => {
  for (const c of digitalThugLife.cases) {
    for (const p of c.parts) {
      for (const [lang, file] of Object.entries(p.files)) {
        const src = read(file!);
        const pages = parseBook(src);
        assert.ok(pages.length >= 8, `${file}: ${pages.length} pages`);
        const words = pages.map(pageText).join(" ").split(/\s+/).length;
        assert.ok(words > 1200 && words < 3800, `${file}: ${words} words`);
        assert.ok(screensOf(pages).length > 0, `${file}: no screens`);
        assert.ok(pages.some((pg) => pg.blocks.some((b) => b.type === "h" && b.tone === "sos")), `${file}: no 🆘 section`);
        // No real brands in the fiction's company names.
        assert.doesNotMatch(src, /\b(WhatsApp|Skype|DHL|FedEx|PhonePe|Paytm|Telegram|Instagram|YouTube|Facebook|Google Pay|GPay)\b/, `${file}: real brand name`);
        for (const id of imageIds(pages)) assert.match(id, /^c\d+p\d+-[a-z]+$/, `${file}: image id ${id}`);
        // RBI and the Income Tax Department require permission before linking to their inner pages; cite them as text.
        assert.doesNotMatch(src, /\]\(https?:\/\/[^)]*(rbi\.org\.in|incometaxindia\.gov\.in)/, `${file}: hyperlink to a site that needs linking permission`);
        if (lang === "hinglish") assert.doesNotMatch(src, /[\u0900-\u097F]/, `${file}: stray Devanagari in Hinglish`);
        if (lang === "hindi") {
          const letters = src.replace(/:::[\s\S]*?:::/g, "").replace(/\(https?:[^)]*\)/g, "");
          const deva = (letters.match(/[\u0900-\u097F]/g) ?? []).length;
          const latin = (letters.match(/[A-Za-z]/g) ?? []).length;
          assert.ok(deva > latin * 3, `${file}: Hindi text is mostly not Devanagari (${deva} vs ${latin})`);
        }
      }
    }
  }
});

test("Hindi parts match their Hinglish originals page for page", () => {
  for (const c of digitalThugLife.cases) {
    for (const p of c.parts) {
      if (!p.files.hindi) continue;
      const hl = parseBook(read(p.files.hinglish));
      const hi = parseBook(read(p.files.hindi));
      assert.equal(hi.length, hl.length, `${p.files.hindi}: page count`);
      assert.deepEqual(hi.map((x) => x.closing), hl.map((x) => x.closing), `${p.files.hindi}: closing page`);
      assert.deepEqual(imageIds(hi), imageIds(hl), `${p.files.hindi}: illustrations`);
      assert.deepEqual(screensOf(hi), screensOf(hl), `${p.files.hindi}: phone screens`);
    }
  }
});

test("Hindi and Hinglish cite the same sources, helplines and amounts", () => {
  const links = (src: string) => [...src.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]).sort();
  const numbers = (src: string) => [...new Set(src.match(/\b(1930|112|14416)\b/g) ?? [])].sort();
  const rupees = (src: string) => (src.match(/₹[\d,]+(?:\.\d+)?/g) ?? []).sort();
  for (const c of digitalThugLife.cases) {
    for (const p of c.parts) {
      if (!p.files.hindi) continue;
      const hl = read(p.files.hinglish);
      const hi = read(p.files.hindi);
      assert.deepEqual(links(hi), links(hl), `${p.files.hindi}: source links differ from Hinglish`);
      assert.deepEqual(numbers(hi), numbers(hl), `${p.files.hindi}: helpline numbers differ from Hinglish`);
      assert.deepEqual(rupees(hi), rupees(hl), `${p.files.hindi}: rupee amounts differ from Hinglish`);
    }
  }
});
