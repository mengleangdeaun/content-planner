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
  Campaign,
  ContentTask,
  ChannelSnapshot,
  Person,
} from "@/lib/types";
import {
  ContentFetchResponse,
  ContentUpdateInput,
  NewContentInput,
  fetchContentData,
  createContentItems,
  updateContentItem,
  updateItemStatus,
} from "@/features/content/services/content-service";
import {
  NewTaskInput,
  addTask,
  saveCampaign,
  updateTask,
} from "@/features/planning/services/planning-service";
import { setUrlParam } from "@/lib/url-params";
import { saveContentInsight } from "@/features/analytics/services/insights-service";
import {
  addChannelSnapshot,
  saveChannelAccount,
  deleteChannelAccount,
} from "@/features/channels/services/channels-service";
import {
  addContentTypeConfig,
  updateContentTypeConfig,
  deleteContentTypeConfig,
} from "@/features/taxonomies/services/taxonomies-service";
import { triggerWorkspaceSync } from "@/features/integrations/services/sync-service";

export type DrawerTab = "details" | "tasks" | "activity";

export type PostFormState =
  | { mode: "create"; preset?: Partial<ContentItem> }
  | { mode: "edit"; item: ContentWithInsight; presetStatus?: ContentStatus };

interface WorkspaceContextValue {
  // Data
  items: ContentWithInsight[];
  channels: ChannelAccount[];
  contentTypes: ContentTypeConfig[];
  campaigns: Campaign[];
  tasks: ContentTask[];
  channelSnapshots: ChannelSnapshot[];
  people: Person[];
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
  onCreateContent: (item: NewContentInput) => Promise<void>;
  onUpdateContent: (fields: ContentUpdateInput) => Promise<void>;
  onReschedule: (item: ContentWithInsight, date: string) => Promise<void>;
  onSaveInsight: (insight: ContentInsight) => Promise<void>;
  onSaveCampaign: (campaign: Partial<Campaign>) => Promise<void>;
  onAddTask: (fields: NewTaskInput) => Promise<void>;
  onUpdateTask: (task: ContentTask, fields: Partial<ContentTask>) => Promise<void>;

  // Channels Operations
  onSaveChannel: (channel: Omit<ChannelAccount, "id"> & { id?: string }) => Promise<void>;
  onDeleteChannel: (id: string) => Promise<void>;
  onAddSnapshot: (input: Pick<ChannelSnapshot, "channel_id" | "followers" | "captured_at">) => Promise<void>;

  // Taxonomies Operations
  onAddContentType: (type: Omit<ContentTypeConfig, "id">) => Promise<void>;
  onUpdateContentType: (type: ContentTypeConfig) => Promise<void>;
  onDeleteContentType: (id: string) => Promise<void>;

  // Dialog Controls
  postForm: PostFormState | null;
  openPostForm: (form: PostFormState) => void;
  closePostForm: () => void;
  isGuideModalOpen: boolean;
  setIsGuideModalOpen: (open: boolean) => void;
  detailDrawerItem: ContentWithInsight | null;
  detailDrawerTab: DrawerTab;
  openDetailDrawer: (item: ContentWithInsight, tab?: DrawerTab) => void;
  closeDetailDrawer: () => void;
  metricsModalItem: ContentWithInsight | null;
  openMetricsModal: (item: ContentWithInsight) => void;
  closeMetricsModal: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  children,
  initialItemId = null,
}: {
  children: ReactNode;
  initialItemId?: string | null;
}) {
  const [items, setItems] = useState<ContentWithInsight[]>([]);
  const [channels, setChannels] = useState<ChannelAccount[]>([]);
  const [contentTypes, setContentTypes] = useState<ContentTypeConfig[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tasks, setTasks] = useState<ContentTask[]>([]);
  const [channelSnapshots, setChannelSnapshots] = useState<ChannelSnapshot[]>([]);
  const [people, setPeople] = useState<Person[]>([]);

  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Dialog & Drawer States
  const [postForm, setPostForm] = useState<PostFormState | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  // Stored by id so the drawer always shows the latest copy, and a shared link works once data loads.
  const [detailDrawerId, setDetailDrawerId] = useState<string | null>(initialItemId);
  const detailDrawerItem = items.find((item) => item.id === detailDrawerId) ?? null;
  const [detailDrawerTab, setDetailDrawerTab] = useState<DrawerTab>("details");
  const [metricsModalItem, setMetricsModalItem] = useState<ContentWithInsight | null>(null);

  // Sync responses carry no people list, so only overwrite what came back.
  const applyWorkspace = useCallback((result: Partial<ContentFetchResponse>) => {
    if (result.data) setItems(result.data);
    if (result.channels) setChannels(result.channels);
    if (result.contentTypes) setContentTypes(result.contentTypes);
    if (result.campaigns) setCampaigns(result.campaigns);
    if (result.tasks) setTasks(result.tasks);
    if (result.channelSnapshots) setChannelSnapshots(result.channelSnapshots);
    if (result.people) setPeople(result.people);
  }, []);

  const applyItem = useCallback((updated: ContentItem) => {
    setItems((prev) => prev.map((i) => (i.id === updated.id ? { ...i, ...updated } : i)));
  }, []);

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
        applyWorkspace(await fetchContentData(fresh));
      } catch (err: unknown) {
        console.error("Failed to load workspace data:", err);
        const message = err instanceof Error ? err.message : "Error loading data from server";
        showToast(message);
      } finally {
        setLoading(false);
        setIsSyncing(false);
      }
    },
    [applyWorkspace, showToast]
  );

  useEffect(() => {
    let active = true;
    const initialLoad = async () => {
      try {
        const result = await fetchContentData(false);
        if (active) {
          applyWorkspace(result);
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
  }, [applyWorkspace, showToast]);

  // Picks up teammates' changes without a Sync click. The server answers from its 30-second
  // cache, so this does not add Google Sheets reads. Quiet on failure: it retries next time.
  useEffect(() => {
    const refreshQuietly = () => {
      if (document.visibilityState !== "visible") return;
      fetchContentData(false).then(applyWorkspace).catch(() => {});
    };
    const timer = setInterval(refreshQuietly, 60 * 1000);
    document.addEventListener("visibilitychange", refreshQuietly);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshQuietly);
    };
  }, [applyWorkspace]);

  const syncNow = useCallback(async () => {
    try {
      setIsSyncing(true);
      applyWorkspace(await triggerWorkspaceSync());
      showToast("Synced successfully with Google Sheet");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Sync failed. Check credentials.";
      showToast(message);
    } finally {
      setIsSyncing(false);
    }
  }, [applyWorkspace, showToast]);

  const onStatusChange = useCallback(
    async (item: ContentWithInsight, newStatus: ContentStatus) => {
      // Publishing needs a live URL, so ask for it instead of letting the server refuse.
      if (newStatus === "Published" && !item.live_post_url) {
        setDetailDrawerId(null); // Two modals at once fight over focus.
        setUrlParam("item", null);
        setPostForm({ mode: "edit", item, presetStatus: "Published" });
        return;
      }

      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, status: newStatus } : i))
      );

      try {
        applyItem(await updateItemStatus(item, newStatus));
        showToast(`Status updated to "${newStatus}" for ${item.id}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to update status";
        showToast(`Failed to update status: ${message}`);
        refreshData();
      }
    },
    [applyItem, refreshData, showToast]
  );

  const onCreateContent = useCallback(
    async (newItem: NewContentInput) => {
      const created = await createContentItems(newItem);
      setItems((prev) => [...created, ...prev]);
      showToast(
        created.length > 1
          ? `Created "${created[0].title}" for ${created.length} channels`
          : `Created "${created[0].title}"`
      );
    },
    [showToast]
  );

  const onUpdateContent = useCallback(
    async (fields: ContentUpdateInput) => {
      const updated = await updateContentItem(fields);
      applyItem(updated);
      showToast(`Saved "${updated.title}"`);
    },
    [applyItem, showToast]
  );

  const onReschedule = useCallback(
    async (item: ContentWithInsight, date: string) => {
      if (item.publish_date === date) return;
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, publish_date: date } : i)));
      try {
        applyItem(
          await updateContentItem({
            id: item.id,
            publish_date: date,
            expected_updated_at: item.updated_at ?? "",
          })
        );
        showToast(`Moved "${item.title}" to ${date}`);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Failed to move the post");
        refreshData();
      }
    },
    [applyItem, refreshData, showToast]
  );

  const onSaveCampaign = useCallback(
    async (campaign: Partial<Campaign>) => {
      const saved = await saveCampaign(campaign);
      setCampaigns((prev) => {
        const others = prev.filter((c) => c.id !== saved.id);
        return saved.status === "Archived" ? others : [...others, saved];
      });
      showToast(`Campaign "${saved.name}" saved`);
    },
    [showToast]
  );

  const onAddTask = useCallback(async (fields: NewTaskInput) => {
    const created = await addTask(fields);
    setTasks((prev) => [...prev, created]);
  }, []);

  const onUpdateTask = useCallback(
    async (task: ContentTask, fields: Partial<ContentTask>) => {
      const merge = (list: ContentTask[], next: ContentTask) =>
        list.flatMap((t) => (t.id !== next.id ? [t] : next.status === "archived" ? [] : [next]));
      setTasks((prev) => merge(prev, { ...task, ...fields }));
      try {
        const saved = await updateTask(task.id, fields);
        setTasks((prev) => merge(prev, saved));
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Failed to update task");
        refreshData();
      }
    },
    [refreshData, showToast]
  );

  const onSaveInsight = useCallback(
    async (insight: ContentInsight) => {
      await saveContentInsight(insight);
      setItems((prev) =>
        prev.map((i) => (i.id === insight.id ? { ...i, insight } : i))
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
      showToast("Channel archived");
    },
    [showToast]
  );

  const onAddSnapshot = useCallback(
    async (input: Pick<ChannelSnapshot, "channel_id" | "followers" | "captured_at">) => {
      const saved = await addChannelSnapshot(input);
      setChannelSnapshots((prev) => [...prev, { ...saved, followers: Number(saved.followers) }]);
      showToast("Followers saved");
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
      const previousName = contentTypes.find((t) => t.id === type.id)?.name;
      const { item: updated, renamedPosts } = await updateContentTypeConfig(type);
      setContentTypes((prev) =>
        prev.map((t) => (t.id === updated.id ? updated : t))
      );
      if (renamedPosts > 0 && previousName) {
        setItems((prev) =>
          prev.map((i) => (i.content_type === previousName ? { ...i, content_type: updated.name } : i))
        );
      }
      showToast(
        renamedPosts > 0
          ? `"${updated.name}" saved, and ${renamedPosts} post${renamedPosts === 1 ? "" : "s"} updated`
          : `"${updated.name}" saved`
      );
    },
    [contentTypes, showToast]
  );

  const onDeleteContentType = useCallback(
    async (id: string) => {
      await deleteContentTypeConfig(id);
      setContentTypes((prev) => prev.filter((c) => c.id !== id));
      showToast("Content type archived");
    },
    [showToast]
  );

  const openDetailDrawer = useCallback((item: ContentWithInsight, tab: DrawerTab = "details") => {
    setDetailDrawerTab(tab);
    setDetailDrawerId(item.id);
    setUrlParam("item", item.id);
  }, []);

  const closeDetailDrawer = useCallback(() => {
    setDetailDrawerId(null);
    setUrlParam("item", null);
  }, []);

  const closePostForm = useCallback(() => setPostForm(null), []);

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
    campaigns,
    tasks,
    channelSnapshots,
    people,
    loading,
    isSyncing,
    toastMessage,
    showToast,
    refreshData,
    syncNow,
    onStatusChange,
    onCreateContent,
    onUpdateContent,
    onReschedule,
    onSaveInsight,
    onSaveCampaign,
    onAddTask,
    onUpdateTask,
    onSaveChannel,
    onDeleteChannel,
    onAddSnapshot,
    onAddContentType,
    onUpdateContentType,
    onDeleteContentType,
    postForm,
    openPostForm: setPostForm,
    closePostForm,
    isGuideModalOpen,
    setIsGuideModalOpen,
    detailDrawerItem,
    detailDrawerTab,
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
