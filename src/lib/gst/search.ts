/**
 * Type-ahead matching for the item and category pickers, case-insensitive:
 * options whose name (or code) starts with the query come first, then those
 * where any other word starts with it. "t" finds "Tiles" and "Truck hire",
 * not "Stone dust"; "996" finds SAC 9966.
 */

export type SearchOption = { value: string; label: string; group?: string; code?: string };

export function filterOptions<T extends SearchOption>(query: string, options: readonly T[], limit = 60): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, limit);
  const starts: T[] = [];
  const words: T[] = [];
  for (const option of options) {
    const label = option.label.toLowerCase();
    if (label.startsWith(q) || (option.code && option.code.startsWith(q))) starts.push(option);
    else if (label.split(/[\s(/·,-]+/).some((word) => word.startsWith(q))) words.push(option);
  }
  return [...starts, ...words].slice(0, limit);
}
