"use client";

import React from "react";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { PersonPicker } from "@/features/team/components/person-picker";
import { ContentWithInsight } from "@/lib/types";

// Assign a post straight from a list. People who cannot edit posts see the name only.
export function AssigneePicker({ item, className }: { item: ContentWithInsight; className?: string }) {
  const { onAssign } = useWorkspace();
  const { can } = useAuth();
  return (
    <PersonPicker
      aria-label={`Assignee for ${item.title}`}
      value={item.assignee_email ?? ""}
      onChange={(email) => onAssign(item, email)}
      readOnly={!can("content.edit")}
      className={className}
    />
  );
}
