/** Plain-text report shared by the PDF and Excel downloads. */
export type RatioReport = {
  title: string;
  unitLabel: string;
  inputs: { section: string; rows: [string, string][] }[];
  derived: [string, string, string][];
  groups: { title: string; rows: [string, string, string][] }[];
  dupont: [string, string][];
  dupontNote: string;
  disclaimer: string;
};
