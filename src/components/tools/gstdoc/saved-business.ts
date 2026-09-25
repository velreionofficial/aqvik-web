"use client";

import * as React from "react";

/**
 * Shares the opt-in "Remember my business details" with the GST invoice tool
 * (same browser key), so a business types its name, address and GSTIN once.
 * Other saved fields, such as bank details, are kept untouched.
 */
const STORAGE_KEY = "aqvik-gst-business-v1";

export type Business = { legalName: string; tradeName: string; address: string; gstin: string; phone: string };

export function useSavedBusiness(apply: (business: Business) => void) {
  const [remember, setRemember] = React.useState(false);
  const applied = React.useRef(false);

  React.useEffect(() => {
    if (applied.current) return;
    applied.current = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as { supplier?: Business }) : null;
      if (saved?.supplier) {
        setRemember(true);
        apply(saved.supplier);
      }
    } catch {
      /* storage unavailable */
    }
  }, [apply]);

  const save = React.useCallback((business: Business) => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const saved = raw ? (JSON.parse(raw) as Record<string, unknown>) : {};
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, supplier: business }));
    } catch {
      /* ignore */
    }
  }, []);

  const forget = React.useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    setRemember(false);
  }, []);

  return { remember, setRemember, save, forget };
}
