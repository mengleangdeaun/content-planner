"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { toast } from "@/components/ui/toast";
import {
  ContentWithInsight,
  ContentStatus,
  ContentInsight,
  ContentItem,
  ChannelAccount,
  ContentTypeConfig,
} from "@/lib/types";
import {
  fetchContentData,
  createContentItem,
  updateItemStatus,
} from "@/features/content/services/content-service";
import { saveContentInsight } from "@/features/analytics/services/insights-service";
import {
  saveChannelAccount,
  deleteChannelAccount,
} from "@/features/channels/services/channels-service";
import {
  addContentTypeConfig,
  updateContentTypeConfig,
  deleteContentTypeConfig,
} from "@/features/taxonomies/services/taxonomies-service";
import { triggerWorkspaceSync } from "@/features/integrations/services/sync-service";

interface WorkspaceContextValue {
  // Data
  items: ContentWithInsight[];
  channels: ChannelAccount[];
  contentTypes: ContentTypeConfig[];
  loading: boolean;
  isSyncing: boolean;

  // Notifications
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Refresh & Sync
  refreshData: (fresh?: boolean) => Promise<void>;
  syncNow: () => Promise<void>;

  // Content Operations
  onStatusChange: (item: ContentWithInsight, newStatus: ContentStatus) => Promise<void>;
  onCreateContent: (item: Omit<ContentItem, "id">) => Promise<void>;
  onSaveInsight: (insight: ContentInsight) => Promise<void>;

  // Channels Operations
  onSaveChannel: (channel: Omit<ChannelAccount, "id"> & { id?: string }) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;

  // Taxonomies Operations
  onAddContentType: (type: Omit<ContentTypeConfig, "id">) => Promise<void>;
  onUpdateContentType: (type: ContentTypeConfig) => Promise<void>;
  onDeleteContentType: (id: string) => Promise<void>;

  // Dialog Controls
  isCreateModalOpen: boolean;
  setIsCreateModalOpen: (open: boolean) => void;
  isGuideModalOpen: boolean;
  setIsGuideModalOpen: (open: boolean) => void;
  detailDrawerItem: ContentWithInsight | null;
  openDetailDrawer: (item: ContentWithInsight) => void;
  closeDetailDrawer: () => void;
  metricsModalItem: ContentWithInsight | null;
  openMetricsModal: (item: ContentWithInsight) => void;
  closeMetricsModal: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ContentWithInsight[]>([]);
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentTypeConfig[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dialog & Drawer States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [detailDrawerItem, setDetailDrawerItem] = useState<ContentWithInsight | null>(null);
  const [metricsModalItem, setMetricsModalItem] = useState<ContentWithInsight | null>(null);

  const showToast = useCallback((msg: string) => {
    toast.success(msg);
    setToastMessage(msg);
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, []);

  const refreshData = useCallback(
    async (fresh = false) => {
      try {
        if (fresh) setIsSyncing(true);
        const result = await fetchContentData(fresh);
        if (result.data) setItems(result.data);
        if (result.channels) setChannels(result.channels);
        if (result.contentTypes) setContentTypes(result.contentTypes);
      } catch (err: unknown) {
        console.error("Failed to load workspace data:", err);
        const message = err instanceof Error ? err.message : "Error loading data from server";
        showToast(message);
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    },
    [showToast]
  );

  useEffect(() => {
    let active = true;
    const initialLoad = async () => {
      try {
        const result = await fetchContentData(false);
        if (active) {
          if (result.data) setItems(result.data);
          if (result.channels) setChannels(result.channels);
          if (result.contentTypes) setContentTypes(result.contentTypes);
          setLoading(false);
        }
      } catch (err: unknown) {
        if (active) {
          const message = err instanceof Error ? err.message : "Error loading data from server";
          showToast(message);
          setLoading(false);
        }
      }
    };
    initialLoad();
    return () => {
      active = false;
    };
  }, [showToast]);

  const syncNow = useCallback(async () => {
    try {
      setIsSyncing(true);
      const result = await triggerWorkspaceSync();
      if (result.data) setItems(result.data);
      if (result.channels) setChannels(result.channels);
      if (result.contentTypes) setContentTypes(result.contentTypes);
      showToast("Synced successfully with Google Sheet");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sync failed. Check credentials.";
      showToast(message);
    } finally {
      setIsSyncing(false);
    }
  }, [showToast]);

  const onStatusChange = useCallback(
    async (item: ContentWithInsight, newStatus: ContentStatus) => {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );

      setDetailDrawerItem((prev) =>
        prev && prev.id === item.id ? { ...prev, status: newStatus } : prev
      );

      try {
        await updateItemStatus(item, newStatus);
        showToast(`Status updated to "${newStatus}" for ${item.id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update status";
        showToast(`Failed to update status: ${message}`);
        refreshData();
      }
    },
    [refreshData, showToast]
  );

  const onCreateContent = useCallback(
    async (newItem: Omit<ContentItem, "id">) => {
      const created = await createContentItem(newItem);
      const itemWithInsight: ContentWithInsight = {
        ...created,
        insight: undefined,
      };
      setItems((prev) => [itemWithInsight, ...prev]);
      showToast(`Created "${created.title}"`);
    },
    [showToast]
  );

  const onSaveInsight = useCallback(
    async (insight: ContentInsight) => {
      await saveContentInsight(insight);
      setItems((prev) =>
        prev.map((i) => (i.id === insight.id ? { ...i, insight } : i))
      );
      setDetailDrawerItem((prev) =>
        prev && prev.id === insight.id ? { ...prev, insight } : prev
      );
      showToast(`Metrics logged for ${insight.id}`);
    },
    [showToast]
  );

  const onSaveChannel = useCallback(
    async (channel: Omit<ChannelAccount, "id"> & { id?: string }) => {
      const saved = await saveChannelAccount(channel);
      setChannels((prev) => {
        const idx = prev.findIndex((c) => c.id === saved.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = saved;
          return next;
        }
        return [...prev, saved];
      });
      showToast(`Channel "${saved.account_name}" saved`);
    },
    [showToast]
  );

  const onDeleteChannel = useCallback(
    async (id: string) => {
      await deleteChannelAccount(id);
      setChannels((prev) => prev.filter((c) => c.id !== id));
      showToast("Channel removed");
    },
    [showToast]
  );

  const onAddContentType = useCallback(
    async (type: Omit<ContentTypeConfig, "id">) => {
      const created = await addContentTypeConfig(type);
      setContentTypes((prev) => [...prev, created]);
      showToast(`Category "${created.name}" added`);
    },
    [showToast]
  );

  const onUpdateContentType = useCallback(
    async (type: ContentTypeConfig) => {
      const updated = await updateContentTypeConfig(type);
      setContentTypes((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      showToast(`Category "${updated.name}" updated`);
    },
    [showToast]
  );

  const onDeleteContentType = useCallback(
    async (id: string) => {
      await deleteContentTypeConfig(id);
      setContentTypes((prev) => prev.filter((c) => c.id !== id));
      showToast("Category removed");
    },
    [showToast]
  );

  const openDetailDrawer = useCallback((item: ContentWithInsight) => {
    setDetailDrawerItem(item);
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerItem(null);
  }, []);

  const openMetricsModal = useCallback((item: ContentWithInsight) => {
    setMetricsModalItem(item);
  }, []);

  const closeMetricsModal = useCallback(() => {
    setMetricsModalItem(null);
  }, []);

  const value: WorkspaceContextValue = {
    items,
    channels,
    contentTypes,
    loading,
    isSyncing,
    toastMessage,
    showToast,
    refreshData,
    syncNow,
    onStatusChange,
    onCreateContent,
    onSaveInsight,
    onSaveChannel,
    onDeleteChannel,
    onAddContentType,
    onUpdateContentType,
    onDeleteContentType,
    isCreateModalOpen,
    setIsCreateModalOpen,
    isGuideModalOpen,
    setIsGuideModalOpen,
    detailDrawerItem,
    openDetailDrawer,
    closeDetailDrawer,
    metricsModalItem,
    openMetricsModal,
    closeMetricsModal,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return ctx;
}
