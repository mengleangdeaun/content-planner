"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { useWorkspace } from "@/context/workspace-context";
import { cn } from "@/lib/utils";

// Full class strings, so Tailwind can see them. Keys match TYPE_COLORS in lib/settings-rules.ts.
export const TYPE_COLOR_CLASSES: Record<string, { badge: string; swatch: string }> = {
  slate: { badge: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/40 dark:text-slate-300", swatch: "bg-slate-500" },
  blue: { badge: "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-300", swatch: "bg-blue-500" },
  teal: { badge: "border-teal-300 bg-teal-50 text-teal-700 dark:border-teal-800 dark:bg-teal-950/40 dark:text-teal-300", swatch: "bg-teal-500" },
  emerald: { badge: "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300", swatch: "bg-emerald-500" },
  amber: { badge: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300", swatch: "bg-amber-500" },
  orange: { badge: "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-800 dark:bg-orange-950/40 dark:text-orange-300", swatch: "bg-orange-500" },
  rose: { badge: "border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-800 dark:bg-rose-950/40 dark:text-rose-300", swatch: "bg-rose-500" },
  violet: { badge: "border-violet-300 bg-violet-50 text-violet-700 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-300", swatch: "bg-violet-500" },
};

export function TypeBadge({ name, className }: { name: string; className?: string }) {
  const { contentTypes } = useWorkspace();
  const color = contentTypes.find((t) => t.name === name)?.badge_color;
  return (
    <Badge variant="outline" className={cn("text-xs font-medium", color ? TYPE_COLOR_CLASSES[color]?.badge : "bg-muted/40", className)}>
      {name}
    </Badge>
  );
}
