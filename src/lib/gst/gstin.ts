import { findState } from "./states.ts";

/**
 * GSTIN: 2-digit state code, 10-character PAN, 1 entity character, "Z", and a
 * check character computed with the base-36 scheme below.
 */

const CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const GSTIN_SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][0-9A-Z]Z[0-9A-Z]$/;
/** UINs (UN bodies, embassies) look like 0717UNO00157UNO: a different structure. */
const UIN_SHAPE = /^[0-9]{4}[A-Z]{3}[0-9]{5}[A-Z0-9]{3}$/;

export function gstinCheckCharacter(first14: string): string {
  let sum = 0;
  for (let index = 0; index < 14; index += 1) {
    const value = CHARSET.indexOf(first14.charAt(index));
    const product = value * (index % 2 === 0 ? 1 : 2);
    sum += Math.floor(product / 36) + (product % 36);
  }
  return CHARSET.charAt((36 - (sum % 36)) % 36);
}

export type GstinCheck =
  | { ok: true; gstin: string; stateCode: string }
  | { ok: false; error: string };

export function normaliseGstin(value: string): string {
  return value.replace(/\s+/g, "").toUpperCase();
}

export function checkGstin(value: string, { allowUinMessage = false } = {}): GstinCheck {
  const gstin = normaliseGstin(value);
  if (gstin === "") return { ok: false, error: "Enter a GSTIN." };
  if (allowUinMessage && UIN_SHAPE.test(gstin)) {
    return { ok: false, error: "UIN recipients are not supported yet." };
  }
  if (gstin.length !== 15) return { ok: false, error: "A GSTIN has 15 characters." };
  if (!GSTIN_SHAPE.test(gstin)) {
    return {
      ok: false,
      error: "This is not a valid GSTIN format: 2-digit state code, 10-character PAN, entity number, Z, check character.",
    };
  }
  const stateCode = gstin.slice(0, 2);
  if (!findState(stateCode)) {
    return { ok: false, error: `State code ${stateCode} is not a current GST state or union territory code.` };
  }
  if (gstinCheckCharacter(gstin.slice(0, 14)) !== gstin.charAt(14)) {
    return { ok: false, error: "The last character does not match; please check the GSTIN for a typing mistake." };
  }
  return { ok: true, gstin, stateCode };
}
