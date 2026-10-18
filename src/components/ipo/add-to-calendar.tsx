"use client";

import { CalendarPlus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { logEvent } from "@/lib/events";
import { ipoCalendarIcs } from "@/lib/ipo/calendar";
import type { Ipo } from "@/lib/ipo/model";

/** Downloads an .ics file made in the browser. Nothing is sent anywhere; no sign-in. */
export function AddToCalendar({ ipo, pageUrl }: { ipo: Ipo; pageUrl: string }) {
  const download = () => {
    const blob = new Blob([ipoCalendarIcs(ipo, pageUrl)], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${ipo.slug}-ipo-dates.ics`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    logEvent("ipo_calendar_added");
  };

  return (
    <Button type="button" variant="secondary" onClick={download} className="gap-2">
      <CalendarPlus aria-hidden="true" className="size-4" />
      Add dates to my calendar
    </Button>
  );
}
