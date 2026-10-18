import type { Ipo } from "./model.ts";

/** All-day calendar events for an IPO's key dates, made in the browser (no server, no email). */
export function ipoCalendarIcs(ipo: Ipo, pageUrl: string, now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  const day = (iso: string) => iso.replace(/-/g, "");
  const next = (iso: string) => new Date(Date.parse(iso) + 86_400_000).toISOString().slice(0, 10).replace(/-/g, "");
  const t = ipo.timeline;
  const events: [string, string | undefined, string][] = [
    ["open", t.open, `${ipo.company} IPO opens`],
    ["close", t.close, `${ipo.company} IPO closes (last day to bid)`],
    ["allotment", t.allotment, `${ipo.company} IPO allotment (tentative)`],
    ["listing", t.listing, `${ipo.company} listing (tentative)`],
  ];
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//AQVIK//IPO dates//EN"];
  for (const [id, date, title] of events) {
    if (!date) continue;
    lines.push(
      "BEGIN:VEVENT",
      `UID:aqvik-ipo-${ipo.slug}-${id}@aqvik.com`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${day(date)}`,
      `DTEND;VALUE=DATE:${next(date)}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:Dates as published by the company and exchanges; post-issue dates may change. ${pageUrl}`,
      `URL:${pageUrl}`,
      "END:VEVENT",
    );
  }
  lines.push("END:VCALENDAR", "");
  return lines.join("\r\n");
}
