"use client";

import React from "react";
import { ContentWithInsight } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDisplayDate } from "@/lib/date-utils";
import { ContentFormatBadge } from "@/features/content";
import { Award, ArrowUpDown } from "lucide-react";
import { SortMetric } from "../hooks/use-analytics-calc";
import { useAuth } from "@/context/auth-context";

interface PerformanceLedgerTableProps {
  sortedLedger: ContentWithInsight[];
  sortBy: SortMetric;
  onSortChange: (sort: SortMetric) => void;
  onOpenDetailDrawer: (item: ContentWithInsight) => void;
  onOpenMetricsModal: (item: ContentWithInsight) => void;
}

export function PerformanceLedgerTable({
  sortedLedger,
  sortBy,
  onSortChange,
  onOpenDetailDrawer,
  onOpenMetricsModal,
}: PerformanceLedgerTableProps) {
  const { can } = useAuth();

  return (
    <Card className="p-0 overflow-hidden shadow-xs">
      <CardHeader className="p-4 border-b bg-muted/20 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-base font-semibold">
            Ranked Performance Ledger
          </CardTitle>
          <CardDescription className="text-xs">
            Individual piece returns sorted by selected strategic outcome metric.
          </CardDescription>
        </div>

        {/* Sort Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="text-xs text-muted-foreground mr-1 flex items-center gap-1">
            <ArrowUpDown className="h-3 w-3" /> Sort:
          </span>
          <Button
            variant={sortBy === "views" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("views")}
            className="h-7 text-xs px-2.5"
          >
            Impressions
          </Button>
          <Button
            variant={sortBy === "engagements" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("engagements")}
            className="h-7 text-xs px-2.5"
          >
            Interactions
          </Button>
          <Button
            variant={sortBy === "clicks" ? "default" : "outline"}
            size="sm"
            onClick={() => onSortChange("clicks")}
            className="h-7 text-xs px-2.5"
          >
            Clicks
          </Button>
        </div>
      </CardHeader>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16 text-center">Rank</TableHead>
            <TableHead className="w-40">Date & Channel</TableHead>
            <TableHead className="min-w-[200px]">Content Title</TableHead>
            <TableHead className="w-28 text-right">Impressions</TableHead>
            <TableHead className="w-28 text-right">Interactions</TableHead>
            <TableHead className="w-28 text-right">Clicks</TableHead>
            <TableHead className="w-28 text-right">CTR / Eng %</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedLedger.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-32 text-center text-muted-foreground text-sm">
                No performance data recorded yet. Use the &quot;Metrics&quot; button in Content Management to log post metrics.
              </TableCell>
            </TableRow>
          ) : (
            sortedLedger.map((item, index) => {
              const views = item.insight?.views_impressions || 0;
              const engagements = item.insight?.engagements || 0;
              const clicks = item.insight?.clicks || 0;
              const engagementRate = views > 0 ? ((engagements / views) * 100).toFixed(2) : "0.00";
              const ctr = views > 0 ? ((clicks / views) * 100).toFixed(2) : "0.00";

              return (
                <TableRow
                  key={item.id}
                  className="cursor-pointer group"
                  onClick={() => onOpenDetailDrawer(item)}
                >
                  <TableCell className="text-center font-bold text-xs" onClick={(e) => e.stopPropagation()}>
                    {index === 0 ? (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 font-bold text-xs">
                        <Award className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="text-muted-foreground">#{index + 1}</span>
                    )}
                  </TableCell>

                  <TableCell>
                    <span className="font-medium text-xs text-foreground block">
                      {formatDisplayDate(item.publish_date)}
                    </span>
                    <span className="text-[11px] text-muted-foreground">
                      {item.platform} &bull; {item.account_name}
                    </span>
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="outline" className="text-[10px] py-0 h-4">
                          {item.content_type}
                        </Badge>
                        <ContentFormatBadge isPoster={item.is_poster} isVideo={item.is_video} />
                      </div>
                    </div>
                  </TableCell>

                  <TableCell className="text-right font-medium text-xs">
                    {views.toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right font-medium text-xs">
                    {engagements.toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right font-medium text-xs text-primary font-semibold">
                    {clicks.toLocaleString()}
                  </TableCell>

                  <TableCell className="text-right text-xs">
                    <div className="font-semibold text-foreground">{ctr}% CTR</div>
                    <div className="text-[11px] text-muted-foreground">{engagementRate}% eng</div>
                  </TableCell>

                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {can("metrics.edit") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onOpenMetricsModal(item)}
                          className="h-7 text-xs px-2 text-primary"
                        >
                          Edit
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onOpenDetailDrawer(item)}
                        className="h-7 text-xs px-2"
                      >
                        View
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

