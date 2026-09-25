"use client";

import * as React from "react";
import { ChevronDown, X } from "lucide-react";

import { inputClass } from "@/components/tools/gst/fields";
import { filterOptions, type SearchOption } from "@/lib/gst/search";
import { cn } from "@/lib/utils";

/**
 * Accessible type-ahead combobox (ARIA 1.2 pattern). Typing filters the list
 * (names starting with what you type come first); arrow keys move, Enter
 * picks, Escape closes. With `freeText`, whatever is typed is kept as the
 * value; without it, only a picked option counts and the box clears on blur.
 */
export function Combobox({
  id,
  label,
  optional,
  placeholder,
  text,
  onTextChange,
  onPick,
  options,
  freeText = false,
  hint,
  error,
  onClear,
}: {
  id: string;
  label: string;
  optional?: boolean;
  placeholder?: string;
  /** What the input shows. */
  text: string;
  onTextChange?: (text: string) => void;
  onPick: (option: SearchOption) => void;
  options: readonly SearchOption[];
  freeText?: boolean;
  hint?: string;
  error?: string;
  onClear?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState<string | null>(null);
  const [active, setActive] = React.useState(0);
  const listId = `${id}-list`;
  const shown = query ?? (freeText ? text : "");
  const results = React.useMemo(() => filterOptions(shown, options), [shown, options]);

  const pick = (option: SearchOption) => {
    onPick(option);
    setQuery(null);
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && open && results[active]) {
      event.preventDefault();
      pick(results[active]!);
    } else if (event.key === "Escape") {
      setOpen(false);
      setQuery(null);
    }
  };

  let lastGroup: string | undefined;

  return (
    <div className="relative">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
        {optional ? <span className="ml-2 font-normal text-muted-dim">Optional</span> : null}
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && results[active] ? `${listId}-${active}` : undefined}
          aria-invalid={error ? true : undefined}
          aria-describedby={[hint ? `${id}-hint` : null, error ? `${id}-error` : null].filter(Boolean).join(" ") || undefined}
          autoComplete="off"
          placeholder={placeholder}
          value={query ?? text}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            const value = event.target.value;
            setOpen(true);
            setActive(0);
            if (freeText) {
              onTextChange?.(value);
              setQuery(null);
            } else {
              setQuery(value);
            }
          }}
          onBlur={() => {
            // Let a click on an option land before closing.
            window.setTimeout(() => {
              setOpen(false);
              setQuery(null);
            }, 120);
          }}
          onKeyDown={onKeyDown}
          className={cn(inputClass, "pr-16", error ? "border-warning/60" : "border-white/10")}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {onClear && text ? (
            <button
              type="button"
              aria-label={`Clear ${label.toLowerCase()}`}
              onClick={onClear}
              className="rounded-md p-1 text-muted-dim hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          ) : null}
          <ChevronDown aria-hidden="true" className="size-4 text-muted-dim" />
        </div>
      </div>

      {open && results.length > 0 ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1.5 max-h-72 w-full overflow-y-auto rounded-xl border border-white/10 bg-[#0b1224] p-1 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]"
        >
          {results.map((option, index) => {
            const heading = option.group && option.group !== lastGroup ? option.group : null;
            lastGroup = option.group;
            return (
              <React.Fragment key={`${option.value}-${index}`}>
                {heading ? (
                  <li role="presentation" className="px-3 pb-1 pt-2.5 font-mono text-[0.6875rem] uppercase tracking-wider text-muted-dim">
                    {heading}
                  </li>
                ) : null}
                <li
                  id={`${listId}-${index}`}
                  role="option"
                  aria-selected={index === active}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => pick(option)}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "cursor-pointer rounded-lg px-3 py-2 text-[0.9375rem]",
                    index === active ? "bg-primary/15 text-foreground" : "text-muted",
                  )}
                >
                  {option.label}
                </li>
              </React.Fragment>
            );
          })}
        </ul>
      ) : null}

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
