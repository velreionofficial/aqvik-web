/**
 * Masks identifiers in text shown on screen or exported: long digit runs
 * (account, card, reference and phone numbers) keep only their last 4 digits,
 * and UPI IDs keep only the first 2 characters before the @.
 */
export function maskText(text: string): string {
  return text
    .replace(/\b([A-Za-z0-9._-]{2})[A-Za-z0-9._-]*@([A-Za-z]+)\b/g, "$1•••@$2")
    .replace(/\d{6,}/g, (m) => `••••${m.slice(-4)}`);
}
