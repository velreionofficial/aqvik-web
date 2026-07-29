export type LegalBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: readonly string[] };

export type LegalSection = {
  id: string;
  heading: string;
  blocks: readonly LegalBlock[];
};

export type LegalDocument = {
  title: string;
  summary: string;
  updated: string;
  sections: readonly LegalSection[];
};
