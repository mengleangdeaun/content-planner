import React from "react";
import { ChannelHealth } from "@/lib/settings-rules";
import { cn } from "@/lib/utils";

const STATE_STYLE: Record<ChannelHealth["state"], { bar: string; label: string; text: string }> = {
  "on-track": { bar: "bg-primary", label: "On track", text: "text-primary" },
  behind: { bar: "bg-amber-500", label: "Behind", text: "text-amber-700 dark:text-amber-400" },
  paused: { bar: "bg-muted-foreground/40", label: "Paused", text: "text-muted-foreground" },
};

export function lastPostText(days: number | null): string {
  if (days === null) return "No published posts yet";
  if (days === 0) return "Last post today";
  return `Last post ${days} day${days === 1 ? "" : "s"} ago`;
}

export function ChannelHealthBar({ health, periodLabel = "this week" }: { health: ChannelHealth; periodLabel?: string }) {
  const style = STATE_STYLE[health.state];
  const percent = Math.min(100, Math.round((health.planned / Math.max(health.quota, 1)) * 100));
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {health.planned} of {health.quota} planned {periodLabel}
        </span>
        <span className={cn("font-medium", style.text)}>{style.label}</span>
      </div>
      <div
        role="progressbar"
        aria-label={`Posts planned ${periodLabel} against the target`}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-1.5 overflow-hidden rounded-full bg-muted"
      >
        <div className={cn("h-full", style.bar)} style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">{lastPostText(health.daysSinceLastPost)}</p>
    </div>
  );
}
