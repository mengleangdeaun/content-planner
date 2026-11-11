"use client";

import React, { useState } from "react";
import { ContentWithInsight } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { BarChart3, TrendingUp, MousePointerClick, Eye } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";

export function MetricsModal() {
  const { metricsModalItem } = useWorkspace();
  if (!metricsModalItem) return null;
  return <MetricsForm key={metricsModalItem.id} item={metricsModalItem} />;
}

function MetricsForm({ item }: { item: ContentWithInsight }) {
  const { metricsModalItem, closeMetricsModal, onSaveInsight } = useWorkspace();

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
    <Dialog open={Boolean(metricsModalItem)} onOpenChange={(open) => !open && closeMetricsModal()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold tracking-tight">
                Log Performance Metrics
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Manual weekly metrics entry for: <strong className="text-foreground">{item.title}</strong>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Post Reference info */}
          <div className="rounded-lg border bg-muted/40 p-3 text-xs flex justify-between items-center">
            <div>
              <span className="text-muted-foreground font-mono block">{item.id}</span>
              <span className="font-semibold text-foreground">{item.platform} &bull; {item.account_name}</span>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground block">Format</span>
              <span className="font-medium text-foreground">
                {item.is_poster && item.is_video ? "Poster + Video" : item.is_poster ? "Poster" : item.is_video ? "Video" : "Standard"}
              </span>
            </div>
          </div>

          {/* Form fields */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Total Views / Impressions
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 12500"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Total Engagements (Likes, Comments, Shares)
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 450"
                value={engagements}
                onChange={(e) => setEngagements(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MousePointerClick className="h-3.5 w-3.5" /> Outbound Link Clicks
              </label>
              <Input
                type="number"
                min="0"
                placeholder="e.g. 85"
                value={clicks}
                onChange={(e) => setClicks(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Live computed performance indicators */}
          {numViews > 0 && (
            <Card className="p-3 bg-primary/5 border-primary/20 space-y-1 text-xs">
              <div className="flex justify-between items-center text-primary font-semibold">
                <span>Calculated Engagement Rate:</span>
                <span className="text-sm font-bold">{engagementRate}%</span>
              </div>
              <div className="flex justify-between items-center text-muted-foreground">
                <span>Calculated Click-Through Rate (CTR):</span>
                <span className="font-medium text-foreground">{ctr}%</span>
              </div>
            </Card>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={closeMetricsModal}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving Metrics..." : "Save Metrics"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
