"use client";

import { useState, useMemo } from "react";
import { ContentWithInsight } from "@/lib/types";
import { isDateInFilter, DateFilterPreset } from "@/lib/date-utils";

export interface ContentFilterState {
  search: string;
  setSearch: (search: string) => void;
  datePreset: DateFilterPreset;
  setDatePreset: (preset: DateFilterPreset) => void;
  customStartDate: string;
  setCustomStartDate: (date: string) => void;
  customEndDate: string;
  setCustomEndDate: (date: string) => void;
  selectedAccount: string;
  setSelectedAccount: (account: string) => void;
  selectedType: string;
  setSelectedType: (type: string) => void;
  selectedFormat: string;
  setSelectedFormat: (format: string) => void;
  selectedStatus: string;
  setSelectedStatus: (status: string) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  filteredItems: ContentWithInsight[];
}

export function useContentFilter(items: ContentWithInsight[]): ContentFilterState {
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Date filter
      if (!isDateInFilter(item.publish_date, datePreset, customStartDate, customEndDate)) {
        return false;
      }

      if (selectedAccount !== "all" && item.account_name !== selectedAccount) return false;
      if (selectedType !== "all" && item.content_type !== selectedType) return false;

      // Format Filter
      if (selectedFormat !== "all") {
        if (selectedFormat === "poster" && !item.is_poster) return false;
        if (selectedFormat === "video" && !item.is_video) return false;
        if (selectedFormat === "both" && (!item.is_poster || !item.is_video)) return false;
        if (selectedFormat === "poster_only" && (!item.is_poster || item.is_video)) return false;
        if (selectedFormat === "video_only" && (item.is_poster || !item.is_video)) return false;
      }

      if (selectedStatus !== "all" && item.status !== selectedStatus) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const inTitle = item.title?.toLowerCase().includes(query);
        const inId = item.id?.toLowerCase().includes(query);
        const inCopy = item.copy_text?.toLowerCase().includes(query);
        if (!inTitle && !inId && !inCopy) return false;
      }

      return true;
    });
  }, [
    items,
    datePreset,
    customStartDate,
    customEndDate,
    selectedAccount,
    selectedType,
    selectedFormat,
    selectedStatus,
    search,
  ]);

  const resetFilters = () => {
    setDatePreset("all");
    setCustomStartDate("");
    setCustomEndDate("");
    setSelectedAccount("all");
    setSelectedType("all");
    setSelectedFormat("all");
    setSelectedStatus("all");
    setSearch("");
  };

  const hasActiveFilters =
    datePreset !== "all" ||
    selectedAccount !== "all" ||
    selectedType !== "all" ||
    selectedFormat !== "all" ||
    selectedStatus !== "all" ||
    Boolean(customStartDate) ||
    Boolean(customEndDate) ||
    Boolean(search.trim());

  return {
    search,
    setSearch,
    datePreset,
    setDatePreset,
    customStartDate,
    setCustomStartDate,
    customEndDate,
    setCustomEndDate,
    selectedAccount,
    setSelectedAccount,
    selectedType,
    setSelectedType,
    selectedFormat,
    setSelectedFormat,
    selectedStatus,
    setSelectedStatus,
    resetFilters,
    hasActiveFilters,
    filteredItems,
  };
}

