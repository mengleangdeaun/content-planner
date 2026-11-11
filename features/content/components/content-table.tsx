"use client";

import React from "react";
import { ContentWithInsight, ContentStatus } from "@/lib/types";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { ContentTableRow } from "./content-table-row";

interface ContentTableProps {
  items: ContentWithInsight[];
  onOpenDetailDrawer: (item: ContentWithInsight) => void;
  onOpenMetricsModal: (item: ContentWithInsight) => void;
  onStatusChange: (item: ContentWithInsight, newStatus: ContentStatus) => void;
}

export function ContentTable({
  items,
  onOpenDetailDrawer,
  onOpenMetricsModal,
  onStatusChange,
}: ContentTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-40">Publish Date & ID</TableHead>
          <TableHead className="w-36">Channel</TableHead>
          <TableHead className="w-44">Content Type & Format</TableHead>
          <TableHead className="min-w-[240px]">Title & Copy</TableHead>
          <TableHead className="w-32">Status</TableHead>
          <TableHead className="w-28">Workspace Doc</TableHead>
          <TableHead className="w-36 text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
              No content records found matching your date or filters.
            </TableCell>
          </TableRow>
        ) : (
          items.map((item) => (
            <ContentTableRow
              key={item.id}
              item={item}
              onOpenDetailDrawer={onOpenDetailDrawer}
              onOpenMetricsModal={onOpenMetricsModal}
              onStatusChange={onStatusChange}
            />
          ))
        )}
      </TableBody>
    </Table>
  );
}

