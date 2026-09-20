"use client";

import { cn } from "@/lib/utils";
import { useId } from "react";

type Base = {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
};

function Shell({
  label,
  hint,
  error,
  required,
  id,
  children,
  className,
}: Base & { id: string; children: React.ReactNode }) {
  return (
    <div className={cn("", className)}>
      <label htmlFor={id} className="flex items-baseline justify-between gap-4">
        <span className="meta text-ink-muted">
          {label}
          {required ? <span className="ml-1.5 text-acm">*</span> : null}
        </span>
        {hint ? <span className="font-mono text-micro uppercase text-ink-ghost">{hint}</span> : null}
      </label>
      <div className="mt-3">{children}</div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-2 font-mono text-micro uppercase text-acm-bright">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const control =
  "w-full border bg-transparent px-4 py-3.5 text-[0.9375rem] text-ink placeholder:text-ink-ghost " +
  "transition-colors duration-200 focus:border-acm focus:outline-none focus:ring-0";

export function TextField({
  label,
  hint,
  error,
  required,
  className,
  ...rest
}: Base & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} required={required} id={id} className={className}>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(control, error ? "border-acm" : "border-line hover:border-line-strong")}
        {...rest}
      />
    </Shell>
  );
}

export function TextArea({
  label,
  hint,
  error,
  required,
  className,
  ...rest
}: Base & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} required={required} id={id} className={className}>
      <textarea
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(control, "resize-y", error ? "border-acm" : "border-line hover:border-line-strong")}
        {...rest}
      />
    </Shell>
  );
}

export function SelectField({
  label,
  hint,
  error,
  required,
  className,
  options,
  ...rest
}: Base & { options: readonly string[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const id = useId();
  return (
    <Shell label={label} hint={hint} error={error} required={required} id={id} className={className}>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        className={cn(control, "appearance-none", error ? "border-acm" : "border-line hover:border-line-strong")}
        {...rest}
      >
        {options.map((option) => (
          <option key={option} value={option} className="bg-surface">
            {option}
          </option>
        ))}
      </select>
    </Shell>
  );
}

/** Multi-select rendered as toggles rather than a listbox. */
export function ChipGroup({
  label,
  hint,
  error,
  required,
  options,
  value,
  onToggle,
  className,
}: Base & {
  options: readonly string[];
  value: string[];
  onToggle: (option: string) => void;
}) {
  const id = useId();
  return (
    <fieldset className={className} aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="flex w-full items-baseline justify-between gap-4">
        <span className="meta text-ink-muted">
          {label}
          {required ? <span className="ml-1.5 text-acm">*</span> : null}
        </span>
        {hint ? <span className="font-mono text-micro uppercase text-ink-ghost">{hint}</span> : null}
      </legend>
      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const active = value.includes(option);
          return (
            <button
              key={option}
              type="button"
              aria-pressed={active}
              onClick={() => onToggle(option)}
              className={cn(
                "border px-4 py-2.5 font-mono text-label uppercase transition-colors duration-200",
                active
                  ? "border-acm bg-acm-wash text-ink"
                  : "border-line text-ink-faint hover:border-line-strong hover:text-ink-muted",
              )}
            >
              {option}
            </button>
          );
        })}
      </div>
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-3 font-mono text-micro uppercase text-acm-bright">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}

export function Checkbox({
  label,
  checked,
  onChange,
  hint,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        id={id}
        role="checkbox"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border transition-colors duration-200",
          checked ? "border-acm bg-acm" : "border-line-strong hover:border-ink-faint",
        )}
      >
        {checked ? (
          <span aria-hidden className="text-[0.6rem] leading-none text-white">
            ✓
          </span>
        ) : null}
      </button>
      <label htmlFor={id} className="cursor-pointer text-sm leading-snug text-ink-muted">
        {label}
        {hint ? <span className="mt-1 block font-mono text-micro uppercase text-ink-ghost">{hint}</span> : null}
      </label>
    </div>
  );
}
