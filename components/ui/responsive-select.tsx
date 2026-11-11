"use client";

import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export interface SelectOption {
  value: string;
  label: string;
}

interface ResponsiveSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  /** Applied on desktop only. Phones always get the full-size native control. */
  className?: string;
}

// A native <select> on phones opens the OS picker. Desktop keeps the styled dropdown.
export function ResponsiveSelect({
  value,
  onValueChange,
  options,
  placeholder,
  disabled,
  id,
  "aria-label": ariaLabel,
  className,
}: ResponsiveSelectProps) {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="relative w-full">
        <select
          id={id}
          aria-label={ariaLabel}
          value={value}
          disabled={disabled}
          onChange={(e) => onValueChange(e.target.value)}
          className="h-11 w-full appearance-none truncate rounded-md border border-input bg-transparent pr-9 pl-3 text-base shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30"
        >
          {placeholder && !value && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground"
        />
      </div>
    );
  }

  return (
    <Select
      value={value}
      disabled={disabled}
      items={[...options]}
      onValueChange={(next) => next !== null && onValueChange(next)}
    >
      <SelectTrigger id={id} aria-label={ariaLabel} className={className ?? "w-full"}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
