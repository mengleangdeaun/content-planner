"use client";

import React from "react";
import { ContentStatus, ContentWithInsight } from "@/lib/types";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useAuth } from "@/context/auth-context";
import { statusPermission } from "@/lib/auth/permissions";
import { cn } from "@/lib/utils";
import { nextStatuses } from "@/lib/workflow";
import { statusStyle } from "./status-style";

interface ContentStatusSelectProps {
  item: ContentWithInsight;
  onStatusChange: (item: ContentWithInsight, status: ContentStatus) => void;
  className?: string;
}

// Offers only the moves the workflow allows and this person may make. Styled as the status's colored pill.
export function ContentStatusSelect({ item, onStatusChange, className }: ContentStatusSelectProps) {
  const { can } = useAuth();
  const moves = nextStatuses(item.status).filter((status) => can(statusPermission(status)));
  const style = statusStyle(item.status);

  return (
    <ResponsiveSelect
      aria-label="Status"
      value={item.status}
      disabled={moves.length === 0}
      className={className}
      prefix={<span className={cn("size-2 shrink-0 rounded-full", style.dot)} />}
      toneClassName={cn("rounded-full font-medium shadow-none", style.pill)}
      options={[item.status, ...moves].map((status) => ({ value: status, label: status }))}
      onValueChange={(value) => value !== item.status && onStatusChange(item, value as ContentStatus)}
    />
  );
}
