"use client";

import React from "react";
import { ContentStatus, ContentWithInsight } from "@/lib/types";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useAuth } from "@/context/auth-context";
import { statusPermission } from "@/lib/auth/permissions";
import { nextStatuses } from "@/lib/workflow";

interface ContentStatusSelectProps {
  item: ContentWithInsight;
  onStatusChange: (item: ContentWithInsight, status: ContentStatus) => void;
  className?: string;
}

// Offers only the moves the workflow allows and this person may make.
export function ContentStatusSelect({ item, onStatusChange, className }: ContentStatusSelectProps) {
  const { can } = useAuth();
  const moves = nextStatuses(item.status).filter((status) => can(statusPermission(status)));

  return (
    <ResponsiveSelect
      aria-label="Status"
      value={item.status}
      disabled={moves.length === 0}
      className={className}
      options={[item.status, ...moves].map((status) => ({ value: status, label: status }))}
      onValueChange={(value) => value !== item.status && onStatusChange(item, value as ContentStatus)}
    />
  );
}
