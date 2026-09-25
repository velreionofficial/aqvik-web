"use client";

import * as React from "react";

import { formatNumber } from "@/lib/calculators/format";
import { cn } from "@/lib/utils";

export type NumberFieldProps = {
  id: string;
  label: string;
  value: number;
  onChange: (value: number, valid: boolean) => void;
  min: number;
  max: number;
  /** Step for the number box and a linear slider. */
  step?: number;
  /** Money ranges span several orders of magnitude, so their slider is logarithmic. */
  scale?: "linear" | "log";
  prefix?: string;
  suffix?: string;
  /** Formats the limits in the error message. */
  formatLimit?: (value: number) => string;
  hint?: string;
};

const SLIDER_STEPS = 1000;

function toSlider(value: number, min: number, max: number, scale: "linear" | "log") {
  const v = Math.min(max, Math.max(min, value));
  if (scale === "log") {
    return Math.round((Math.log(v / min) / Math.log(max / min)) * SLIDER_STEPS);
  }
  return v;
}

/** Snaps a log-slider value to a tidy amount (two significant figures). */
function tidy(value: number) {
  if (value < 1000) return Math.round(value / 100) * 100 || 100;
  const magnitude = Math.pow(10, Math.floor(Math.log10(value)) - 1);
  return Math.round(value / magnitude) * magnitude;
}

function fromSlider(position: number, min: number, max: number) {
  const raw = min * Math.pow(max / min, position / SLIDER_STEPS);
  return Math.min(max, Math.max(min, tidy(raw)));
}

/**
 * A labelled number box paired with a slider. The box keeps whatever the user
 * types; an out-of-range or empty value shows an inline error and is reported
 * as invalid, so results never show NaN or Infinity.
 */
export function NumberField({
  id,
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  scale = "linear",
  prefix,
  suffix,
  formatLimit = formatNumber,
  hint,
}: NumberFieldProps) {
  const [text, setText] = React.useState(() => formatNumber(value));
  const [focused, setFocused] = React.useState(false);
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  const parsed = Number(text.replace(/,/g, "").trim());
  const error =
    text.trim() === "" || !Number.isFinite(parsed)
      ? `Enter a number between ${formatLimit(min)} and ${formatLimit(max)}.`
      : parsed < min || parsed > max
        ? `Enter a number between ${formatLimit(min)} and ${formatLimit(max)}.`
        : null;

  // Keep the box in step with the slider when the user is not typing in it.
  React.useEffect(() => {
    if (!focused) setText(formatNumber(value));
  }, [value, focused]);

  const commitText = (next: string) => {
    setText(next);
    const n = Number(next.replace(/,/g, "").trim());
    const ok = next.trim() !== "" && Number.isFinite(n) && n >= min && n <= max;
    onChange(ok ? n : value, ok);
  };

  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ");

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <label htmlFor={id} className="text-[0.9375rem] font-medium text-foreground">
          {label}
        </label>
        <div
          className={cn(
            "flex w-40 shrink-0 items-center rounded-xl border bg-background/60 px-3 focus-within:ring-2 focus-within:ring-primary",
            error ? "border-warning/60" : "border-white/10",
          )}
        >
          {prefix ? <span className="text-sm text-muted-dim">{prefix}</span> : null}
          <input
            id={id}
            inputMode="decimal"
            autoComplete="off"
            value={text}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false);
              if (!error) setText(formatNumber(parsed));
            }}
            onChange={(event) => commitText(event.target.value)}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy || undefined}
            className="w-full min-w-0 bg-transparent py-2.5 text-right text-[0.9375rem] tabular-nums text-foreground focus:outline-none"
          />
          {suffix ? <span className="pl-1 text-sm text-muted-dim">{suffix}</span> : null}
        </div>
      </div>

      <input
        type="range"
        aria-label={`${label} slider`}
        min={scale === "log" ? 0 : min}
        max={scale === "log" ? SLIDER_STEPS : max}
        step={scale === "log" ? 1 : step}
        value={toSlider(value, min, max, scale)}
        onChange={(event) => {
          const position = Number(event.target.value);
          const next = scale === "log" ? fromSlider(position, min, max) : position;
          setText(formatNumber(next));
          onChange(next, true);
        }}
        className="range mt-4 w-full"
      />

      {hint ? (
        <p id={hintId} className="mt-2 text-xs text-muted-dim">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="mt-2 text-sm text-warning">
          {error}
        </p>
      ) : null}
    </div>
  );
}
