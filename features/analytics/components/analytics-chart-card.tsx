"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { TypeComparisonItem } from "../hooks/use-analytics-calc";

interface AnalyticsChartCardProps {
  data: TypeComparisonItem[];
}

export function AnalyticsChartCard({ data }: AnalyticsChartCardProps) {
  return (
    <Card className="shadow-xs">
      <CardHeader className="pb-3 border-b">
        <CardTitle className="text-base font-semibold">
          Performance by Strategic Category
        </CardTitle>
        <CardDescription className="text-xs">
          Comparative volume, audience engagements, and clicks across registered content types.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        {data.length === 0 ? (
          <div className="flex h-56 items-center justify-center text-xs text-muted-foreground">
            No performance metrics logged yet.
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--border)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Bar
                  dataKey="views"
                  name="Impressions"
                  fill="var(--color-chart-1, #3b82f6)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="engagements"
                  name="Engagements"
                  fill="var(--color-chart-2, #10b981)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="clicks"
                  name="Clicks"
                  fill="var(--color-chart-3, #f59e0b)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

