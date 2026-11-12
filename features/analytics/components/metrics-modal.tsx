"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { ContentInsight, ContentWithInsight } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT, Field, FieldRow, FormActions, FormError, FormSection } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { useWorkspace } from "@/context/workspace-context";
import { formatDisplayDate } from "@/lib/date-utils";
import { cn } from "@/lib/utils";
import { fetchInsightHistory } from "../services/insights-service";

export function MetricsModal() {
  const { metricsModalItem } = useWorkspace();
  if (!metricsModalItem) return null;
  return <MetricsForm key={metricsModalItem.id} item={metricsModalItem} />;
}

const numberProps = { type: "number", min: "0", step: "1", inputMode: "numeric", className: CONTROL_HEIGHT } as const;
const HISTORY_SHOWN = 5;

// Blank stays blank for optional counts, so "not counted" never turns into 0.
const startValue = (value?: number) => (value === undefined ? "" : String(value));

function MetricsForm({ item }: { item: ContentWithInsight }) {
  const { closeMetricsModal, onSaveInsight } = useWorkspace();
  const last = item.insight;
  const today = format(new Date(), "yyyy-MM-dd");

  const [capturedAt, setCapturedAt] = useState(today);
  const [views, setViews] = useState(startValue(last?.views_impressions));
  const [engagements, setEngagements] = useState(startValue(last?.engagements));
  const [clicks, setClicks] = useState(startValue(last?.clicks));
  const [reach, setReach] = useState(startValue(last?.reach));
  const [comments, setComments] = useState(startValue(last?.comments));
  const [shares, setShares] = useState(startValue(last?.shares));
  const [saves, setSaves] = useState(startValue(last?.saves));
  const [history, setHistory] = useState<ContentInsight[] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Loads quietly: the form works the same if the history cannot be fetched.
  useEffect(() => {
    fetchInsightHistory(item.id).then(setHistory).catch(() => setHistory([]));
  }, [item.id]);

  const numViews = Number(views) || 0;
  const engagementRate = numViews > 0 ? ((Number(engagements) / numViews) * 100).toFixed(2) : "0.00";
  const ctr = numViews > 0 ? ((Number(clicks) / numViews) * 100).toFixed(2) : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (capturedAt > today) return setError("The counted-on date cannot be in the future.");
    try {
      setIsSubmitting(true);
      await onSaveInsight({
        id: item.id,
        captured_at: capturedAt || today,
        views_impressions: Number(views),
        engagements: Number(engagements),
        clicks: Number(clicks),
        ...(reach !== "" && { reach: Number(reach) }),
        ...(comments !== "" && { comments: Number(comments) }),
        ...(shares !== "" && { shares: Number(shares) }),
        ...(saves !== "" && { saves: Number(saves) }),
      });
      closeMetricsModal();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save metrics");
    } finally {
      setIsSubmitting(false);
    }
  };

  const shown = history?.slice(0, HISTORY_SHOWN) ?? [];

  return (
    <ResponsiveModal
      open
      onClose={closeMetricsModal}
      size="lg"
      title="Log metrics"
      description={`${item.title} · ${item.platform} · ${item.account_name}`}
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={closeMetricsModal} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" form="metrics-form" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save metrics"}
            </Button>
          </FormActions>
        </div>
      }
    >
      <form id="metrics-form" onSubmit={handleSubmit} className="space-y-6">
        <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
          Enter the post&apos;s totals so far. Each save adds a new count to its history, so you can see how it grows.
        </p>

        <FormSection title="Counts">
          <FieldRow>
            <Field
              label="Counted on"
              htmlFor="metric-date"
              required
              help="The day you read these numbers from the platform. Pick an earlier date to log past figures; they go into the history without replacing newer counts."
            >
              <ResponsiveDatePicker id="metric-date" value={capturedAt} onChange={setCapturedAt} clearable={false} />
            </Field>
          </FieldRow>
          <FieldRow columns={3}>
            <Field label="Impressions" htmlFor="metric-views" required help="How many times the post was shown, including repeat views by the same person.">

              <Input id="metric-views" {...numberProps} placeholder="e.g. 12500" value={views} onChange={(e) => setViews(e.target.value)} required />
            </Field>
            <Field
              label="Engagements"
              htmlFor="metric-engagements"
              required
              help="All interactions with the post: likes and reactions, comments, shares and saves, as the platform totals them."
            >
              <Input id="metric-engagements" {...numberProps} placeholder="e.g. 450" value={engagements} onChange={(e) => setEngagements(e.target.value)} required />
            </Field>
            <Field label="Link clicks" htmlFor="metric-clicks" required help="Clicks on links in the post that lead people away from the platform, such as to your website.">

              <Input id="metric-clicks" {...numberProps} placeholder="e.g. 85" value={clicks} onChange={(e) => setClicks(e.target.value)} required />
            </Field>
          </FieldRow>
          {numViews > 0 && (
            <p className="text-sm text-muted-foreground">
              Engagement rate <span className="font-semibold text-foreground">{engagementRate}%</span> · Click-through rate{" "}
              <span className="font-semibold text-foreground">{ctr}%</span>
            </p>
          )}
        </FormSection>

        <FormSection title="More detail (optional)">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <Field label="Reach" htmlFor="metric-reach" help="How many different people saw the post. Usually lower than impressions.">
              <Input id="metric-reach" {...numberProps} value={reach} onChange={(e) => setReach(e.target.value)} />
            </Field>
            <Field label="Comments" htmlFor="metric-comments">
              <Input id="metric-comments" {...numberProps} value={comments} onChange={(e) => setComments(e.target.value)} />
            </Field>
            <Field label="Shares" htmlFor="metric-shares">
              <Input id="metric-shares" {...numberProps} value={shares} onChange={(e) => setShares(e.target.value)} />
            </Field>
            <Field label="Saves" htmlFor="metric-saves">
              <Input id="metric-saves" {...numberProps} value={saves} onChange={(e) => setSaves(e.target.value)} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Earlier counts">
          {history === null ? (
            <p className="text-sm text-muted-foreground">Loading history...</p>
          ) : shown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No counts logged yet. This will be the first.</p>
          ) : (
            <ul className="divide-y rounded-md border text-sm">
              {shown.map((count, i) => {
                const previous = history[i + 1];
                const change = previous ? count.views_impressions - previous.views_impressions : null;
                return (
                  <li key={`${count.captured_at}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                    <span className="text-muted-foreground">{formatDisplayDate((count.captured_at ?? "").slice(0, 10))}</span>
                    <span className="flex items-center gap-3 tabular-nums">
                      <span className="text-foreground">{count.views_impressions.toLocaleString()} impressions</span>
                      {change !== null && (
                        <span className={cn("text-xs", change >= 0 ? "text-primary" : "text-destructive")}>
                          {change >= 0 ? "+" : ""}
                          {change.toLocaleString()}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </FormSection>
      </form>
    </ResponsiveModal>
  );
}
