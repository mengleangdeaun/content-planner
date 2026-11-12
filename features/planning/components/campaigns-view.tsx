"use client";

import { useConfirm } from "@/components/shared/confirm-dialog";
import React, { useMemo, useState } from "react";
import { format } from "date-fns";
import { Archive, CalendarRange, CheckCircle2, Flag, Layers, Pencil, Plus, Search, Timer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CONTROL_HEIGHT, Field, FieldRow, FormActions, FormError } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Textarea } from "@/components/ui/textarea";
import { ActionButton } from "@/components/shared/action-button";
import { NoData, NoResults } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchableMultiSelect } from "@/components/shared/searchable-multi-select";
import { StatsCard, StatsGrid } from "@/components/shared/stats-card";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { ContentStatusBadge } from "@/features/content/components/content-status-badge";
import { statusStyle } from "@/features/content/components/status-style";
import {
  CAMPAIGN_SORTS,
  CampaignSort,
  campaignBreakdown,
  campaignTiming,
  filterCampaigns,
  linkChanges,
  sortCampaigns,
} from "@/lib/campaign-rules";
import { formatShortDate } from "@/lib/date-utils";
import { Campaign, CampaignStatus, ContentWithInsight } from "@/lib/types";
import { cn } from "@/lib/utils";

// Archiving has its own action on the card, so the form offers only the working statuses.
const STATUSES: CampaignStatus[] = ["Planned", "Active", "Completed"];
const SHOWN_POSTS = 5;

// Full class strings, so Tailwind can see them.
const CAMPAIGN_STYLE: Record<string, { dot: string; pill: string }> = {
  Planned: {
    dot: "bg-slate-400",
    pill: "border-slate-300 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-300",
  },
  Active: {
    dot: "bg-blue-500",
    pill: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300",
  },
  Completed: {
    dot: "bg-green-600",
    pill: "border-green-400 bg-green-100 text-green-900 dark:border-green-700 dark:bg-green-900/60 dark:text-green-200",
  },
};

// One color per stage, taken from the post status colors used everywhere else.
const BUCKET_DOT: Record<string, string> = {
  published: statusStyle("Published").dot,
  ready: statusStyle("Scheduled").dot,
  review: statusStyle("In Review").dot,
  progress: statusStyle("In Production").dot,
};

const STATS = [
  { status: "Active", label: "Active", icon: <Timer /> },
  { status: "Planned", label: "Planned", icon: <CalendarRange /> },
  { status: "Completed", label: "Completed", icon: <CheckCircle2 /> },
];

/** Every post a campaign could take, labelled with the campaign it is in now. */
function usePostOptions(campaignId: string | undefined) {
  const { items, campaigns } = useWorkspace();
  return useMemo(() => {
    const names = new Map(campaigns.map((c) => [c.id, c.name]));
    return items
      .filter((item) => item.status !== "Archived")
      .map((item) => {
        const elsewhere = item.campaign_id && item.campaign_id !== campaignId ? names.get(item.campaign_id) : undefined;
        // The title gets its own line; channel, date and current campaign go underneath.
        return {
          value: item.id,
          label: item.title,
          hint: [item.account_name, formatShortDate(item.publish_date), elsewhere && `in ${elsewhere}`]
            .filter(Boolean)
            .join(" · "),
        };
      });
  }, [items, campaigns, campaignId]);
}

export function CampaignsView() {
  const { campaigns, items } = useWorkspace();
  const { can } = useAuth();
  const [editing, setEditing] = useState<Campaign | "new" | null>(null);
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState<string[]>([]);
  const [sort, setSort] = useState<CampaignSort>("start");
  const canManage = can("planning.manage");

  const visible = sortCampaigns(filterCampaigns(campaigns, { search, statuses }), sort);
  const live = new Set(campaigns.map((c) => c.id));
  const linkedPosts = items.filter((i) => i.status !== "Archived" && i.campaign_id && live.has(i.campaign_id)).length;
  const filtersActive = Boolean(search.trim()) || statuses.length > 0;
  const clearFilters = () => {
    setSearch("");
    setStatuses([]);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaigns"
        description="Group posts around a goal and track how far along each campaign is."
        actions={
          canManage && (
            <Button onClick={() => setEditing("new")} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>New Campaign</span>
            </Button>
          )
        }
      />

      {/* Each status card is a shortcut for the Status filter; clicking it again clears it. */}
      <StatsGrid columns={4}>
        {STATS.map((stat) => {
          const active = statuses.length === 1 && statuses[0] === stat.status;
          return (
            <StatsCard
              key={stat.status}
              label={stat.label}
              value={campaigns.filter((c) => c.status === stat.status).length}
              icon={stat.icon}
              active={active}
              onClick={() => setStatuses(active ? [] : [stat.status])}
            />
          );
        })}
        <StatsCard label="Posts in campaigns" value={linkedPosts} icon={<Layers />} hint="Across all live campaigns" />
      </StatsGrid>

      <Card className="p-4">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_14rem_14rem_auto]">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              aria-label="Search campaigns"
              placeholder="Search name or goal..."
              value={search}
              enterKeyHint="search"
              onChange={(e) => setSearch(e.target.value)}
              className={cn("pl-9", CONTROL_HEIGHT)}
            />
          </div>
          <SearchableMultiSelect
            label="Statuses"
            value={statuses}
            onValueChange={setStatuses}
            options={STATUSES.map((s) => ({ value: s, label: s }))}
          />
          <ResponsiveSelect
            aria-label="Sort campaigns"
            value={sort}
            onValueChange={(value) => setSort(value as CampaignSort)}
            options={CAMPAIGN_SORTS.map((s) => ({ value: s.value, label: `Sort: ${s.label}` }))}
          />
          {filtersActive && (
            <Button variant="ghost" onClick={clearFilters} className={cn("text-muted-foreground", CONTROL_HEIGHT)}>
              Reset filters
            </Button>
          )}
        </div>
      </Card>

      {visible.length === 0 ? (
        <Card className="p-0">
          {campaigns.length > 0 ? (
            <NoResults onClear={clearFilters} />
          ) : (
            <NoData
              icon={<Flag />}
              title="No campaigns yet"
              description="Group posts around a goal, then add the posts that belong to it."
              action={
                canManage && (
                  <Button onClick={() => setEditing("new")} className="gap-2">
                    <Plus className="h-4 w-4" /> New campaign
                  </Button>
                )
              }
            />
          )}
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {visible.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} onEdit={() => setEditing(campaign)} />
          ))}
        </div>
      )}

      {editing && <CampaignDialog campaign={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function CampaignStatusPill({ status }: { status: string }) {
  const style = CAMPAIGN_STYLE[status] ?? CAMPAIGN_STYLE.Planned;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium", style.pill)}>
      <span aria-hidden className={cn("size-1.5 rounded-full", style.dot)} />
      {status}
    </span>
  );
}

function BreakdownBar({ posts }: { posts: ContentWithInsight[] }) {
  const buckets = campaignBreakdown(posts);
  const published = buckets.find((b) => b.key === "published")!;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {published.count} of {posts.length} published
        </span>
        <span>{Math.round(published.percent)}%</span>
      </div>
      <div
        role="img"
        aria-label={buckets.map((b) => `${b.count} ${b.label.toLowerCase()}`).join(", ")}
        className="flex h-2 overflow-hidden rounded-full bg-muted"
      >
        {buckets.map((b) => (
          <div key={b.key} className={BUCKET_DOT[b.key]} style={{ width: `${b.percent}%` }} />
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
        {buckets
          .filter((b) => b.count > 0)
          .map((b) => (
            <li key={b.key} className="flex items-center gap-1">
              <span aria-hidden className={cn("size-1.5 rounded-full", BUCKET_DOT[b.key])} />
              {b.count} {b.label.toLowerCase()}
            </li>
          ))}
      </ul>
    </div>
  );
}

function CampaignCard({ campaign, onEdit }: { campaign: Campaign; onEdit: () => void }) {
  const { items, onLinkPosts, onSaveCampaign, openDetailDrawer, showToast } = useWorkspace();
  const { can } = useAuth();
  const canManage = can("planning.manage");
  const [showAll, setShowAll] = useState(false);
  const options = usePostOptions(campaign.id);

  const posts = items
    .filter((i) => i.campaign_id === campaign.id && i.status !== "Archived")
    .sort((a, b) => a.publish_date.localeCompare(b.publish_date));
  const shown = showAll ? posts : posts.slice(0, SHOWN_POSTS);
  const today = format(new Date(), "yyyy-MM-dd");

  const changePosts = (selected: string[]) => {
    const { add, remove } = linkChanges(posts.map((p) => p.id), selected);
    onLinkPosts(campaign, add, remove);
  };

  const confirm = useConfirm();
  const archive = async () => {
    const ok = await confirm({
      title: `Archive "${campaign.name}"?`,
      description: posts.length
        ? `Its ${posts.length} post${posts.length === 1 ? "" : "s"} will be taken out of it; the posts themselves are kept.`
        : "It has no posts, so nothing else changes.",
      confirmLabel: "Archive campaign",
    });
    if (!ok) return;
    try {
      await onSaveCampaign({ ...campaign, status: "Archived" });
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to archive campaign");
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-4">
      <div className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="font-semibold text-foreground">{campaign.name}</h2>
          <CampaignStatusPill status={campaign.status} />
        </div>
        {campaign.goal && <p className="line-clamp-2 text-sm text-muted-foreground">{campaign.goal}</p>}
        <p className="text-xs text-muted-foreground">
          {campaign.start_date || campaign.end_date
            ? `${formatShortDate(campaign.start_date)} – ${formatShortDate(campaign.end_date)} · `
            : ""}
          <span className="font-medium text-foreground">{campaignTiming(campaign, today)}</span>
        </p>
      </div>

      <BreakdownBar posts={posts} />

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Posts ({posts.length})</h3>
        {canManage && (
          <SearchableMultiSelect
            label="Posts"
            placeholder="Add posts"
            value={posts.map((p) => p.id)}
            onValueChange={changePosts}
            options={options}
            searchPlaceholder="Search post titles..."
            popupWidth="wide"
          />
        )}

        {posts.length === 0 ? (
          <p className="rounded-md border border-dashed p-3 text-center text-sm text-muted-foreground">
            {canManage ? "No posts yet. Use Add posts to attach some." : "No posts in this campaign yet."}
          </p>
        ) : (
          <ul className="divide-y rounded-md border">
            {shown.map((post) => (
              <li key={post.id} className="flex items-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => openDetailDrawer(post)}
                  className="min-w-0 flex-1 text-left outline-none hover:underline focus-visible:underline"
                >
                  <span className="block truncate text-sm text-foreground">{post.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {post.account_name} · {formatShortDate(post.publish_date)}
                  </span>
                </button>
                <ContentStatusBadge status={post.status} />
                {canManage && (
                  <ActionButton icon={<X />} label={`Remove "${post.title}" from campaign`} onClick={() => onLinkPosts(campaign, [], [post.id])} />
                )}
              </li>
            ))}
          </ul>
        )}
        {posts.length > SHOWN_POSTS && (
          <Button variant="ghost" size="sm" onClick={() => setShowAll(!showAll)} className="h-9 px-2 text-xs md:h-7">
            {showAll ? "Show fewer" : `Show all ${posts.length}`}
          </Button>
        )}
      </section>

      {canManage && (
        <div className="mt-auto flex flex-wrap gap-2 border-t pt-3">
          <ActionButton icon={<Pencil />} label="Edit" onClick={onEdit} showLabel variant="outline" />
          <ActionButton icon={<Archive />} label="Archive" onClick={archive} showLabel variant="outline" />
        </div>
      )}
    </Card>
  );
}

function CampaignDialog({ campaign, onClose }: { campaign: Campaign | null; onClose: () => void }) {
  const { items, onSaveCampaign, onLinkPosts } = useWorkspace();
  // Snapshot when the form opens, so saving links only what changed since then.
  const [initialPosts] = useState(() =>
    campaign ? items.filter((i) => i.campaign_id === campaign.id && i.status !== "Archived").map((i) => i.id) : []
  );
  const [name, setName] = useState(campaign?.name ?? "");
  const [goal, setGoal] = useState(campaign?.goal ?? "");
  const [startDate, setStartDate] = useState(campaign?.start_date ?? "");
  const [endDate, setEndDate] = useState(campaign?.end_date ?? "");
  const [status, setStatus] = useState<CampaignStatus>(campaign?.status || "Planned");
  const [postIds, setPostIds] = useState<string[]>(initialPosts);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const options = usePostOptions(campaign?.id);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSaving(true);
      const saved = await onSaveCampaign({
        id: campaign?.id,
        name,
        goal,
        start_date: startDate,
        end_date: endDate,
        status,
        owner_email: campaign?.owner_email,
      });
      // A new campaign needs its ID before posts can point to it.
      const { add, remove } = linkChanges(initialPosts, postIds);
      await onLinkPosts(saved, add, remove);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save campaign");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      title={campaign ? "Edit campaign" : "New campaign"}
      description="Set the goal and dates, and choose the posts that belong to it."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" form="campaign-form" disabled={isSaving}>{isSaving ? "Saving..." : "Save campaign"}</Button>
          </FormActions>
        </div>
      }
    >
      <form id="campaign-form" onSubmit={submit} className="space-y-3">
        <Field label="Name" htmlFor="campaign-name" required>
          <Input
            id="campaign-name"
            className={CONTROL_HEIGHT}
            value={name}
            autoCapitalize="words"
            onChange={(e) => setName(e.target.value)}
            required
          />
        </Field>
        <Field label="Goal" htmlFor="campaign-goal">
          <Textarea id="campaign-goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} className="resize-none" />
        </Field>
        <FieldRow>
          <Field label="Start date" htmlFor="campaign-start">
            <ResponsiveDatePicker id="campaign-start" value={startDate} onChange={setStartDate} placeholder="Start" />
          </Field>
          <Field label="End date" htmlFor="campaign-end">
            <ResponsiveDatePicker id="campaign-end" value={endDate} onChange={setEndDate} placeholder="End" />
          </Field>
        </FieldRow>
        <Field label="Status" htmlFor="campaign-status">
          <ResponsiveSelect
            id="campaign-status"
            value={status}
            onValueChange={(value) => setStatus(value as CampaignStatus)}
            options={STATUSES.map((option) => ({ value: option, label: option }))}
          />
        </Field>
        <Field label="Posts" hint="Posts in another campaign move here">
          <SearchableMultiSelect
            label="Posts"
            placeholder="Add posts"
            value={postIds}
            onValueChange={setPostIds}
            options={options}
            searchPlaceholder="Search post titles..."
            popupWidth="wide"
          />
        </Field>
      </form>
    </ResponsiveModal>
  );
}
