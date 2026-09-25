"use client";

import * as React from "react";
import { Download, Share2 } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Download / share buttons. make() returns the PDF (or null when the form
 * has errors, after showing them); nothing leaves the browser.
 */
export function DocActions({ make, fileName }: { make: () => Promise<Blob | null>; fileName: string }) {
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [canShare, setCanShare] = React.useState(false);
  React.useEffect(() => setCanShare(typeof navigator !== "undefined" && typeof navigator.canShare === "function"), []);

  const build = async () => {
    setMessage(null);
    setBusy(true);
    try {
      const blob = await make();
      if (!blob) {
        setMessage("Some details are missing or invalid. Check the highlighted fields above.");
        return null;
      }
      return new File([blob], fileName, { type: "application/pdf" });
    } catch {
      setMessage("The PDF could not be created. Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  };

  const download = async () => {
    const file = await build();
    if (!file) return;
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const share = async () => {
    const file = await build();
    if (!file) return;
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: file.name });
      } catch {
        /* closed */
      }
    } else {
      setMessage("Sharing files is not supported in this browser. Use Download instead.");
    }
  };

  return (
    <div className="space-y-3">
      {message ? (
        <p role="alert" className="text-sm text-warning">
          {message}
        </p>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button type="button" size="lg" onClick={download} disabled={busy} className="w-full sm:w-auto">
          <Download aria-hidden="true" className="size-4" />
          {busy ? "Preparing PDF…" : "Download PDF"}
        </Button>
        {canShare ? (
          <Button type="button" size="lg" variant="secondary" onClick={share} disabled={busy} className="w-full sm:w-auto">
            <Share2 aria-hidden="true" className="size-4" />
            Share PDF
          </Button>
        ) : null}
      </div>
      <p className="text-sm text-muted">Nothing you type leaves your browser.</p>
    </div>
  );
}

/** "CN/2026/01" on 2026-09-26 → "CN_2026_01_2026-09-26.pdf" */
export function docFileName(number: string, iso: string, fallback: string): string {
  const base = number.trim().replace(/[^A-Za-z0-9]+/g, "_").replace(/^_|_$/g, "") || fallback;
  return `${base}_${iso || "undated"}.pdf`;
}
