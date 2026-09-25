"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { joinBeta } from "@/content/home";
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
    label: "Google account email",
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
  "w-full rounded-xl border border-white/10 bg-background/60 px-4 py-3 text-[0.9375rem] text-foreground",
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
 * Beta request form, shown inline in section 8. Submitting hands the details
 * to WhatsApp through a `wa.me` deep link: they never touch a server of ours,
 * and the visitor sees and sends the message themselves.
 */
export function BetaRequestForm() {
  const router = useRouter();
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
    setValues(EMPTY);
    // Page views of /beta/thanks are the conversion count; nothing typed here
    // is sent anywhere except the WhatsApp message the visitor sends themselves.
    router.push("/beta/thanks");
  };

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Request beta access"
      className="glass rounded-2xl p-6 sm:p-8"
      noValidate
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => {
          const error = errors[field.name];
          const errorId = `${field.name}-error`;

          return (
            <div key={field.name} className={field.multiline ? "sm:col-span-2" : undefined}>
              <label htmlFor={field.name} className="mb-2 block text-sm font-medium text-foreground">
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
      </div>

      <Button type="submit" size="lg" className="mt-7 w-full sm:w-auto">
        <Send aria-hidden="true" className="size-4" />
        {joinBeta.requestAccess}
      </Button>

      <p className="mt-5 text-sm leading-relaxed text-muted-dim">
        {joinBeta.consentBefore}
        <Link href="/privacy" className="rounded-sm text-primary-soft underline-offset-4 hover:underline">
          {joinBeta.consentLink}
        </Link>
        {joinBeta.consentAfter}
      </p>
    </form>
  );
}
