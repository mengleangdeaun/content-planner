"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { statusStyle } from "./status-style";

interface ContentStatusBadgeProps {
  status: string;
  className?: string;
}

export function ContentStatusBadge({ status, className }: ContentStatusBadgeProps) {
  const style = statusStyle(status);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        style.pill,
        className
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", style.dot)} />
      {status}
    </span>
  );
}
