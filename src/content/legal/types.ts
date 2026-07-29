export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "note"; text: string }
  | { type: "list"; items: readonly string[] }
  | { type: "steps"; items: readonly string[] }
  | { type: "callout"; text: string }
  | { type: "link"; href: string; label: string }
  | {
      type: "table";
      columns: readonly string[];
      rows: readonly (readonly string[])[];
    };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  title: string;
  /** Optional line directly under the title. */
  subtitle?: string;
  /** Optional lead paragraph. */
  summary?: string;
  /** Blocks rendered above the first section, without a heading. */
  intro?: readonly LegalBlock[];
  updated: string;
  sections: readonly LegalSection[];
};
