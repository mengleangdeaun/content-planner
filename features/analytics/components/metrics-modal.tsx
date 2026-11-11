"use client";

import React, { useState } from "react";
import { ContentWithInsight } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { CONTROL_HEIGHT, Field, FormActions, FormError } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { useWorkspace } from "@/context/workspace-context";

export function MetricsModal() {
  const { metricsModalItem } = useWorkspace();
  if (!metricsModalItem) return null;
  return <MetricsForm key={metricsModalItem.id} item={metricsModalItem} />;
}

const numberProps = { type: "number", min: "0", inputMode: "numeric", className: CONTROL_HEIGHT } as const;

function MetricsForm({ item }: { item: ContentWithInsight }) {
  const { closeMetricsModal, onSaveInsight } = useWorkspace();

  const [views, setViews] = useState<string>(item.insight?.views_impressions ? String(item.insight.views_impressions) : "");
  const [engagements, setEngagements] = useState<string>(item.insight?.engagements ? String(item.insight.engagements) : "");
  const [clicks, setClicks] = useState<string>(item.insight?.clicks ? String(item.insight.clicks) : "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numViews = Number(views) || 0;
  const numEngagements = Number(engagements) || 0;
  const numClicks = Number(clicks) || 0;

  const engagementRate = numViews > 0 ? ((numEngagements / numViews) * 100).toFixed(2) : "0.00";
  const ctr = numViews > 0 ? ((numClicks / numViews) * 100).toFixed(2) : "0.00";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (numViews < 0 || numEngagements < 0 || numClicks < 0) {
      setError("Metric values cannot be negative numbers");
      return;
    }

    try {
      setIsSubmitting(true);
      await onSaveInsight({
        id: item.id,
        views_impressions: numViews,
        engagements: numEngagements,
        clicks: numClicks,
      });
      closeMetricsModal();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save metrics";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={closeMetricsModal}
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
      <form id="metrics-form" onSubmit={handleSubmit} className="space-y-3">
        <Field label="Views / impressions" htmlFor="metric-views" required>
          <Input id="metric-views" {...numberProps} placeholder="e.g. 12500" value={views} onChange={(e) => setViews(e.target.value)} required />
        </Field>
        <Field label="Engagements" htmlFor="metric-engagements" hint="Likes, comments, shares" required>
          <Input id="metric-engagements" {...numberProps} placeholder="e.g. 450" value={engagements} onChange={(e) => setEngagements(e.target.value)} required />
        </Field>
        <Field label="Link clicks" htmlFor="metric-clicks" required>
          <Input id="metric-clicks" {...numberProps} placeholder="e.g. 85" value={clicks} onChange={(e) => setClicks(e.target.value)} required />
        </Field>

        {numViews > 0 && (
          <dl className="space-y-1 rounded-lg border bg-muted/40 p-3">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Engagement rate</dt>
              <dd className="font-semibold text-foreground">{engagementRate}%</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Click-through rate</dt>
              <dd className="font-semibold text-foreground">{ctr}%</dd>
            </div>
          </dl>
        )}
      </form>
    </ResponsiveModal>
  );
}
