"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ContentWithInsight } from "@/lib/types";
import { isDateInFilter, DateFilterPreset } from "@/lib/date-utils";
import { isOverdue } from "@/lib/workflow";

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
  selectedCampaign: string;
  setSelectedCampaign: (campaign: string) => void;
  myWork: boolean;
  setMyWork: (on: boolean) => void;
  overdueOnly: boolean;
  setOverdueOnly: (on: boolean) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  filteredItems: ContentWithInsight[];
}

export function useContentFilter(items: ContentWithInsight[], currentEmail: string): ContentFilterState {
  const [search, setSearch] = useState("");
  const [datePreset, setDatePreset] = useState<DateFilterPreset>("all");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedFormat, setSelectedFormat] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedCampaign, setSelectedCampaign] = useState("all");
  const [myWork, setMyWork] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);

  const filteredItems = useMemo(() => {
    const today = format(new Date(), "yyyy-MM-dd");
    return items.filter((item) => {
      // Archived posts stay out of the way unless asked for.
      if (selectedStatus === "all" && item.status === "Archived") return false;
      if (selectedCampaign !== "all" && item.campaign_id !== selectedCampaign) return false;
      if (myWork && item.assignee_email !== currentEmail && item.reviewer_email !== currentEmail) return false;
      if (overdueOnly && !isOverdue(item, today)) return false;

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
    selectedCampaign,
    myWork,
    overdueOnly,
    currentEmail,
    search,
  ]);

  const resetFilters = () => {
    setSelectedCampaign("all");
    setMyWork(false);
    setOverdueOnly(false);
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
    selectedCampaign !== "all" ||
    myWork ||
    overdueOnly ||
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
    selectedCampaign,
    setSelectedCampaign,
    myWork,
    setMyWork,
    overdueOnly,
    setOverdueOnly,
    resetFilters,
    hasActiveFilters,
    filteredItems,
  };
}

