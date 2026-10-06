/**
 * Who the statement belongs to, read from its header: the account holder's name
 * and any care-of / son-of name. Used only as one signal among others; a name
 * match alone never decides anything.
 */
export type StatementContext = { holderNames: string[]; familyNames: string[] };

const clean = (s: string) =>
  s
    .toUpperCase()
    .replace(/[^A-Z .]/g, " ")
    .replace(/\b(MR|MRS|MS|MISS|SHRI|SMT|KUMARI|DR)\b\.?/g, " ")
    .replace(/\s+/g, " ")
    .trim();

export function readStatementContext(texts: string[]): StatementContext {
  const holderNames: string[] = [];
  const familyNames: string[] = [];
  for (const raw of texts.slice(0, 60)) {
    for (const line of raw.split(/\n|\t/)) {
      const holder =
        /^\s*(?:mr|mrs|ms|miss|shri|smt|kumari)\.?\s+([a-z][a-z .]{2,40})$/i.exec(line) ??
        /(?:account\s*(?:holder\s*)?name|customer\s*name)\s*:?\s*([a-z][a-z .]{2,40})/i.exec(line);
      if (holder) holderNames.push(clean(holder[1]!));
      const family = /\b(?:c\/o|s\/o|d\/o|w\/o)\s*:?\s*([a-z][a-z .]{2,40})/i.exec(line);
      if (family) familyNames.push(clean(family[1]!));
    }
  }
  const uniq = (xs: string[]) => [...new Set(xs.filter((x) => x.replace(/\s/g, "").length >= 4))];
  return { holderNames: uniq(holderNames), familyNames: uniq(familyNames) };
}

/**
 * Banks cut counterparty names short ("PRAKASH", "RAM PRAT"). A short name matches a full one
 * when it is at least 5 letters and the full name starts with it, or it equals the first name.
 */
export function nameMatches(counterparty: string, full: string): boolean {
  const c = counterparty.toUpperCase().replace(/\s+/g, " ").trim();
  const f = full.toUpperCase().replace(/\s+/g, " ").trim();
  if (c.replace(/\s/g, "").length < 5) return false;
  return f.startsWith(c) || c.startsWith(f) || c === f.split(" ")[0];
}
