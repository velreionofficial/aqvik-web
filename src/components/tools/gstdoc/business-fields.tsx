"use client";

import { Checkbox, TextArea, TextField } from "@/components/tools/gst/fields";
import type { Business } from "@/components/tools/gstdoc/saved-business";

/** Legal name, trade name, address, GSTIN and phone of the registered business. */
export function BusinessFields({
  value,
  onChange,
  errorFor,
  remember,
  onRemember,
  onForget,
}: {
  value: Business;
  onChange: (business: Business) => void;
  errorFor: (key: string, value: string) => string | undefined;
  remember: boolean;
  onRemember: (remember: boolean) => void;
  onForget: () => void;
}) {
  const set = (key: keyof Business, v: string) => onChange({ ...value, [key]: v });
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="supplier.legalName" label="Legal name" value={value.legalName} onChange={(v) => set("legalName", v)} error={errorFor("supplier.legalName", value.legalName)} />
        <TextField id="supplier.tradeName" label="Trade name" optional value={value.tradeName} onChange={(v) => set("tradeName", v)} hint="Printed large at the top." />
      </div>
      <TextArea id="supplier.address" label="Address" value={value.address} onChange={(v) => set("address", v)} error={errorFor("supplier.address", value.address)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField id="supplier.gstin" label="GSTIN" value={value.gstin} onChange={(v) => set("gstin", v.toUpperCase())} maxLength={15} autoCapitalize="characters" error={errorFor("supplier.gstin", value.gstin)} />
        <TextField id="supplier.phone" label="Phone" optional type="tel" inputMode="tel" value={value.phone} onChange={(v) => set("phone", v)} error={errorFor("supplier.phone", value.phone)} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Checkbox
          id="remember"
          label="Remember my business details on this device"
          checked={remember}
          onChange={(v) => (v ? onRemember(true) : onForget())}
          hint="Saved in this browser only, and shared with the GST invoice generator."
        />
        <button type="button" onClick={onForget} className="rounded-md px-2 py-1 text-sm text-primary-soft underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
          Forget saved details
        </button>
      </div>
    </>
  );
}
