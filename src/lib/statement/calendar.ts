/**
 * A monthly calendar reminder (.ics) for the money review, made in the browser: no server, no email.
 * It repeats on the 2nd of every month at 10:00 local time, starting next month.
 */
export function monthlyReminderIcs(now: Date, url: string): string {
  const y = now.getMonth() === 11 ? now.getFullYear() + 1 : now.getFullYear();
  const m = (now.getMonth() + 1) % 12;
  const pad = (n: number) => String(n).padStart(2, "0");
  const start = `${y}${pad(m + 1)}02T100000`;
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}00Z`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//AQVIK//Money review//EN",
    "BEGIN:VEVENT",
    `UID:aqvik-money-review-${stamp}@aqvik.com`,
    `DTSTAMP:${stamp}`,
    `DTSTART:${start}`,
    "RRULE:FREQ=MONTHLY;BYMONTHDAY=2",
    "SUMMARY:AQVIK money review",
    `DESCRIPTION:Download last month's bank statement from net banking and open ${url} . It takes about a minute and the file stays on your device.`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "TRIGGER:PT0M",
    "ACTION:DISPLAY",
    "DESCRIPTION:AQVIK money review",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
