import * as React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

/** Taller controls on phones, for touch. */
export const CONTROL_HEIGHT = "h-11 md:h-9";

export function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

export function FieldRow({ columns = 2, children }: { columns?: 2 | 3; children: React.ReactNode }) {
  return (
    <div className={cn("grid grid-cols-1 gap-3", columns === 3 ? "md:grid-cols-3" : "md:grid-cols-2")}>{children}</div>
  );
}

interface FieldProps {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: React.ReactNode;
}

export function Field({ label, htmlFor, required, hint, children }: FieldProps) {
  return (
    <div className="min-w-0 space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
          {label}
          {required && <span aria-hidden className="text-destructive">*</span>}
        </Label>
        {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

export function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
      {children}
    </div>
  );
}

/** Footer actions: side by side on desktop, full width and primary-first on phones. */
export function FormActions({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col-reverse gap-2 md:flex-row md:justify-end [&>*]:h-11 md:[&>*]:h-9">{children}</div>;
}

interface ToggleChipProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}

export function ToggleChip({ active, onClick, children }: ToggleChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 max-w-full items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8 [&_svg]:size-4 [&_svg]:shrink-0",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "border-input text-muted-foreground hover:bg-muted/50"
      )}
    >
      {children}
    </button>
  );
}
