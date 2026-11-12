"use client";

import React from "react";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { useWorkspace } from "@/context/workspace-context";
import { PersonAvatar } from "@/components/shared/person-avatar";

const NONE = "none";

interface PersonPickerProps {
  /** An email, or "" for nobody. */
  value: string;
  onChange: (email: string) => void;
  /** Show the name as plain text, for people who may not change it. */
  readOnly?: boolean;
  id?: string;
  "aria-label"?: string;
  className?: string;
}

// Searchable list of the team plus Unassigned, used wherever work is given to someone.
export function PersonPicker({ value, onChange, readOnly, id, "aria-label": ariaLabel, className }: PersonPickerProps) {
  const { people } = useWorkspace();
  const person = people.find((p) => p.email === value);
  const name = person?.name ?? value;

  if (readOnly) {
    return value ? (
      <p className="flex min-w-0 items-center gap-2 text-sm text-foreground">
        <PersonAvatar name={name} avatarUrl={person?.avatar_url} size="xs" />
        <span className="truncate">{name}</span>
      </p>
    ) : (
      <p className="truncate text-sm text-muted-foreground">Unassigned</p>
    );
  }

  const options = [
    { value: NONE, label: "Unassigned" },
    ...people.map((p) => ({
      value: p.email,
      label: p.name,
      icon: <PersonAvatar name={p.name} avatarUrl={p.avatar_url} size="xs" />,
    })),
    // Someone who has since left the team still shows, so the current value is never blank.
    ...(value && !person ? [{ value, label: value, icon: <PersonAvatar name={value} size="xs" /> }] : []),
  ];

  return (
    <SearchableSelect
      id={id}
      aria-label={ariaLabel}
      value={value || NONE}
      onValueChange={(next) => onChange(next === NONE ? "" : next)}
      options={options}
      searchPlaceholder="Search people..."
      className={className}
    />
  );
}
