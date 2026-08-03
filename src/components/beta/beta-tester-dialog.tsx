"use client";

import * as React from "react";
import { Mail, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { siteConfig } from "@/content/site";
import { cn } from "@/lib/utils";

type FieldName = "fullName" | "email" | "device" | "androidVersion" | "reason";

type FormState = Record<FieldName, string>;

const EMPTY: FormState = {
  fullName: "",
  email: "",
  device: "",
  androidVersion: "",
  reason: "",
};

const fields: readonly {
  name: FieldName;
  label: string;
  type: "text" | "email";
  required: boolean;
  placeholder: string;
  multiline?: boolean;
  autoComplete?: string;
}[] = [
  {
    name: "fullName",
    label: "Full name",
    type: "text",
    required: true,
    placeholder: "Your name",
    autoComplete: "name",
  },
  {
    name: "email",
    label: "Email address",
    type: "email",
    required: true,
    placeholder: "you@example.com",
    autoComplete: "email",
  },
  {
    name: "device",
    label: "Device name",
    type: "text",
    required: true,
    placeholder: "e.g. Pixel 7a, Galaxy S23",
  },
  {
    name: "androidVersion",
    label: "Android version",
    type: "text",
    required: false,
    placeholder: "e.g. Android 14",
  },
  {
    name: "reason",
    label: "Why you want to join",
    type: "text",
    required: false,
    placeholder: "Optional — what you would use AQVIK for",
    multiline: true,
  },
];

const inputClass = cn(
  "w-full rounded-xl border border-hairline bg-background px-4 py-3 text-[0.9375rem] text-foreground",
  "placeholder:text-muted-dim transition-colors",
  "focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-surface",
);

function buildMessage(values: FormState): string {
  const lines = [
    "Hi AQVIK Team,",
    "I want to become a Beta Tester.",
    "",
    `Name: ${values.fullName.trim()}`,
    `Email: ${values.email.trim()}`,
    `Device: ${values.device.trim()}`,
  ];

  if (values.androidVersion.trim()) lines.push(`Android version: ${values.androidVersion.trim()}`);
  if (values.reason.trim()) lines.push(`Reason: ${values.reason.trim()}`);

  return lines.join("\n");
}

/**
 * Collects tester details and hands them to WhatsApp through a `wa.me` deep
 * link. The details never touch a server of ours — the visitor's own WhatsApp
 * client sends the message, and they see it before it goes.
 */
export function BetaTesterDialog() {
  const [open, setOpen] = React.useState(false);
  const [values, setValues] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<FieldName, string>>>({});

  const update = (name: FieldName, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors: Partial<Record<FieldName, string>> = {};
    if (!values.fullName.trim()) nextErrors.fullName = "Please enter your name.";
    if (!values.email.trim()) {
      nextErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Please check that email address.";
    }
    if (!values.device.trim()) nextErrors.device = "Please enter your device name.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const url = `https://wa.me/${siteConfig.whatsapp.number}?text=${encodeURIComponent(
      buildMessage(values),
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setOpen(false);
    setValues(EMPTY);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={cn(
            "group flex w-full items-center gap-4 rounded-2xl border border-hairline bg-surface p-5 text-left",
            "transition-colors duration-300 ease-entrance hover:border-hairline-strong hover:bg-surface-raised",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          )}
        >
          <span className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl border border-hairline bg-background text-primary transition-colors duration-300 ease-entrance group-hover:border-primary/40">
            <Mail aria-hidden="true" className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block text-[1.0625rem] font-medium text-foreground">
              Become a Beta Tester
            </span>
            <span className="mt-1 block text-sm leading-relaxed text-muted">
              Send us your details and we will add you to the tester list.
            </span>
          </span>
        </button>
      </DialogTrigger>

      <DialogContent>
        <DialogTitle className="text-display-sm">Become a Beta Tester</DialogTitle>
        <DialogDescription className="mt-3 text-[0.9375rem] leading-relaxed text-muted">
          Closed testing runs on an invite list, so we need the email address tied to your Google
          account to add you. Submitting opens WhatsApp with your details filled in — you send the
          message yourself.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="mt-7 space-y-5" noValidate>
          {fields.map((field) => {
            const error = errors[field.name];
            const errorId = `${field.name}-error`;

            return (
              <div key={field.name}>
                <label
                  htmlFor={field.name}
                  className="mb-2 block text-sm font-medium text-foreground"
                >
                  {field.label}
                  {field.required ? null : (
                    <span className="ml-2 font-normal text-muted-dim">Optional</span>
                  )}
                </label>

                {field.multiline ? (
                  <textarea
                    id={field.name}
                    name={field.name}
                    rows={3}
                    value={values[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    className={cn(inputClass, "resize-none")}
                  />
                ) : (
                  <input
                    id={field.name}
                    name={field.name}
                    type={field.type}
                    value={values[field.name]}
                    onChange={(event) => update(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    autoComplete={field.autoComplete}
                    required={field.required}
                    aria-invalid={error ? true : undefined}
                    aria-describedby={error ? errorId : undefined}
                    className={cn(inputClass, error && "border-warning/60")}
                  />
                )}

                {error ? (
                  <p id={errorId} role="alert" className="mt-2 text-sm text-warning">
                    {error}
                  </p>
                ) : null}
              </div>
            );
          })}

          <Button type="submit" size="lg" className="w-full">
            <Send aria-hidden="true" className="size-4" />
            Send on WhatsApp
          </Button>

          <p className="text-xs leading-relaxed text-muted-dim">
            Your details are not stored on our servers. They are placed into a WhatsApp message on
            your device, which you review and send.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
