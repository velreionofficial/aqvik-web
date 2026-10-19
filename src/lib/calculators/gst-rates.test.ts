import { test } from "node:test";
import assert from "node:assert/strict";

import { gstChanges } from "../../content/tax.ts";
import { rateDirection, rateValue } from "./gst-rates.ts";

test("Rate labels parse", () => {
  assert.equal(rateValue("Nil (exempt)"), 0);
  assert.equal(rateValue("12% / 18%"), 12);
  assert.equal(rateValue("5% (no input tax credit)"), 5);
  assert.equal(rateDirection("28%", "18%"), "down");
  assert.equal(rateDirection("5%", "18%"), "up");
});

test("Every GST row has readable before/after rates, a unique name and no tobacco items", () => {
  const seen = new Set<string>();
  for (const c of gstChanges) {
    assert.ok(Number.isFinite(rateValue(c.before)), `${c.item}: before`);
    assert.ok(Number.isFinite(rateValue(c.after)), `${c.item}: after`);
    assert.ok([0, 5, 18, 40].includes(rateValue(c.after)), `${c.item}: new rate must be Nil, 5%, 18% or 40%`);
    assert.ok(!seen.has(c.item), `${c.item}: duplicate`);
    seen.add(c.item);
    assert.doesNotMatch(c.item, /tobacco|cigarette|bidi|pan masala|gutkha/i, `${c.item}: tobacco is left out on purpose`);
  }
});
