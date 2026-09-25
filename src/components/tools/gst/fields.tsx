"use client";

import type * as React from "react";

import { cn } from "@/lib/utils";

export const inputClass =
  "w-full rounded-xl border bg-background/60 px-3.5 py-2.5 text-[0.9375rem] text-foreground placeholder:text-muted-dim focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary";

type Common = {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  className?: string;
};

function Wrapper({ id, label, error, hint, optional, className, children }: Common & { children: React.ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {optional ? <span className="ml-2 font-normal text-muted-dim">Optional</span> : null}
      </label>
      {children}
      {hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-xs leading-relaxed text-muted-dim">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-warning">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const describedBy = (id: string, error?: string, hint?: string) =>
  [hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined;

export function TextField({
  value,
  onChange,
  placeholder,
  type = "text",
  inputMode,
  maxLength,
  autoCapitalize,
  list,
  ...common
}: Common & {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  maxLength?: number;
  autoCapitalize?: string;
  /** id of a <datalist> with suggestions; free text is still allowed. */
  list?: string;
}) {
  return (
    <Wrapper {...common}>
      <input
        id={common.id}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        list={list}
        autoComplete="off"
        aria-invalid={common.error ? true : undefined}
        aria-describedby={describedBy(common.id, common.error, common.hint)}
        className={cn(inputClass, common.error ? "border-warning/60" : "border-white/10")}
      />
    </Wrapper>
  );
}

export function TextArea({
  value,
  onChange,
  rows = 3,
  placeholder,
  ...common
}: Common & { value: string; onChange: (value: string) => void; rows?: number; placeholder?: string }) {
  return (
    <Wrapper {...common}>
      <textarea
        id={common.id}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={common.error ? true : undefined}
        aria-describedby={describedBy(common.id, common.error, common.hint)}
        className={cn(inputClass, "resize-y", common.error ? "border-warning/60" : "border-white/10")}
      />
    </Wrapper>
  );
}

export function SelectField({
  value,
  onChange,
  options,
  placeholder,
  ...common
}: Common & {
  value: string;
  onChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <Wrapper {...common}>
      <select
        id={common.id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={common.error ? true : undefined}
        aria-describedby={describedBy(common.id, common.error, common.hint)}
        className={cn(inputClass, "appearance-auto", common.error ? "border-warning/60" : "border-white/10")}
      >
        {placeholder !== undefined ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

export function YesNo({
  name,
  legend,
  value,
  onChange,
  yes = "Yes",
  no = "No",
}: {
  name: string;
  legend: string;
  value: boolean | null;
  onChange: (value: boolean) => void;
  yes?: string;
  no?: string;
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {[
          { v: true, label: yes },
          { v: false, label: no },
        ].map((option) => (
          <label
            key={String(option.v)}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-sm focus-within:ring-2 focus-within:ring-primary",
              value === option.v
                ? "border-primary bg-primary text-primary-foreground"
                : "border-white/10 text-muted hover:text-foreground",
            )}
          >
            <input
              type="radio"
              name={name}
              checked={value === option.v}
              onChange={() => onChange(option.v)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Checkbox({
  id,
  label,
  checked,
  onChange,
  hint,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  hint?: string;
}) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[0.9375rem] text-foreground">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="mt-1 size-4 shrink-0 accent-[#22D3EE]"
        />
        <span>{label}</span>
      </label>
      {hint ? <p className="ml-7 mt-1 text-xs text-muted-dim">{hint}</p> : null}
    </div>
  );
}

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass space-y-5 rounded-2xl p-5 sm:p-7">
      <h2 className="text-[1.0625rem] font-semibold">{title}</h2>
      {children}
    </section>
  );
}
