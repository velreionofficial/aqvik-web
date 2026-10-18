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

test("Every published part parses, has pages, screens and a closing section, and stays in Latin script", () => {
  for (const c of digitalThugLife.cases) {
    for (const p of c.parts) {
      const src = readFileSync(join(process.cwd(), "src", "content", "books", p.file), "utf8");
      const pages = parseBook(src);
      assert.ok(pages.length >= 8, `${p.file}: ${pages.length} pages`);
      const words = pages.map(pageText).join(" ").split(/\s+/).length;
      assert.ok(words > 1200 && words < 3500, `${p.file}: ${words} words`);
      assert.ok(pages.some((pg) => pg.blocks.some((b) => b.type === "screen")), `${p.file}: no screens`);
      assert.ok(pages.some((pg) => pg.blocks.some((b) => b.type === "h" && b.tone === "sos")), `${p.file}: no 🆘 section`);
      assert.doesNotMatch(src, /[ऀ-ॿ]/, `${p.file}: stray Devanagari`);
      // No real brands, emblems or agencies' logos in the fiction's company names.
      assert.doesNotMatch(src, /\b(WhatsApp|Skype|DHL|FedEx|PhonePe|Paytm)\b/, `${p.file}: real brand name`);
      for (const id of imageIds(pages)) assert.match(id, /^c\d+p\d+-[a-z]+$/, `${p.file}: image id ${id}`);
    }
  }
});
