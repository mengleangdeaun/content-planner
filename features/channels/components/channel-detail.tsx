"use client";

import { useConfirm } from "@/components/shared/confirm-dialog";
import React, { useState } from "react";
import { format } from "date-fns";
import { Archive, ExternalLink, Pencil } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { CONTROL_HEIGHT, FormError } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveDatePicker } from "@/components/ui/responsive-date-picker";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { ContentStatusBadge } from "@/features/content/components/content-status-badge";
import { resolveChannelId } from "@/lib/auth/permissions";
import { formatDisplayDate, formatShortDate, isDateInFilter } from "@/lib/date-utils";
import { channelHealth, followerTrend } from "@/lib/settings-rules";
import { ChannelAccount } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChannelHealthBar } from "./channel-health-bar";

const SECTION_TITLE = "text-sm font-semibold text-foreground";

interface ChannelDetailProps {
  channel: ChannelAccount;
  onClose: () => void;
  onEdit: () => void;
}

export function ChannelDetail({ channel, onClose, onEdit }: ChannelDetailProps) {
  const { items, channels, people, channelSnapshots, onDeleteChannel, openDetailDrawer, showToast } = useWorkspace();
  const { can } = useAuth();
  const today = format(new Date(), "yyyy-MM-dd");

  const posts = items.filter((item) => resolveChannelId(item, channels) === channel.id);
  const health = channelHealth(channel, posts, today);
  const upcoming = posts
    .filter((p) => p.status !== "Archived" && p.publish_date >= today && isDateInFilter(p.publish_date, "next-7-days"))
    .sort((a, b) => a.publish_date.localeCompare(b.publish_date));
  const trend = followerTrend(channelSnapshots.filter((s) => s.channel_id === channel.id));
  const owner = people.find((p) => p.email === channel.owner_email)?.name ?? channel.owner_email;

  const confirm = useConfirm();
  const archive = async () => {
    const ok = await confirm({
      title: `Archive ${channel.account_name}?`,
      description: "Its posts stay in the plan. To bring the channel back, clear archived_at in the sheet.",
      confirmLabel: "Archive channel",
    });
    if (!ok) return;
    try {
      await onDeleteChannel(channel.id);
      onClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to archive channel");
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      variant="side"
      title={channel.account_name}
      description={[channel.platform, channel.handle].filter(Boolean).join(" · ")}
      header={
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant={channel.status === "Active" ? "default" : "secondary"}>{channel.status}</Badge>
            {channel.brand && <Badge variant="outline">{channel.brand}</Badge>}
          </div>
          <div className="flex flex-wrap gap-2">
            {can("channels.manage") && (
              <Button variant="outline" size="sm" onClick={onEdit} className="h-10 gap-1.5 md:h-8">
                <Pencil /> Edit
              </Button>
            )}
            {channel.page_url && (
              <a
                href={channel.page_url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-10 gap-1.5 md:h-8")}
              >
                <ExternalLink /> Open page
              </a>
            )}
            {can("channels.manage") && (
              <Button variant="outline" size="sm" onClick={archive} className="h-10 gap-1.5 md:h-8">
                <Archive /> Archive
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        <section className="space-y-2">
          <h3 className={SECTION_TITLE}>This week</h3>
          <ChannelHealthBar health={health} />
        </section>

        <dl className="divide-y rounded-lg border px-3 text-sm">
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Owner</dt>
            <dd className="font-medium text-foreground">{owner || "No owner"}</dd>
          </div>
          <div className="flex justify-between gap-4 py-2.5">
            <dt className="text-muted-foreground">Target</dt>
            <dd className="font-medium text-foreground">{channel.weekly_target_quota} posts a week</dd>
          </div>
          {channel.notes && (
            <div className="space-y-1 py-2.5">
              <dt className="text-muted-foreground">Notes</dt>
              <dd className="whitespace-pre-wrap text-foreground">{channel.notes}</dd>
            </div>
          )}
        </dl>

        {can("metrics.view") && (
          <section className="space-y-3">
            <h3 className={SECTION_TITLE}>Followers</h3>
            {trend.latest !== null ? (
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-semibold text-foreground">{trend.latest.toLocaleString()}</span>
                {trend.change !== null && (
                  <span className={cn("text-sm font-medium", trend.change >= 0 ? "text-primary" : "text-destructive")}>
                    {trend.change >= 0 ? "+" : ""}
                    {trend.change.toLocaleString()} since last count
                  </span>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No follower counts yet.</p>
            )}
            {trend.history.length > 0 && (
              <ul className="divide-y rounded-lg border px-3 text-sm">
                {trend.history.slice(0, 6).map((s, idx) => (
                  <li key={`${s.captured_at}-${idx}`} className="flex justify-between py-2">
                    <span className="text-muted-foreground">{formatDisplayDate(s.captured_at)}</span>
                    <span className="font-medium text-foreground">{Number(s.followers).toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            )}
            {can("metrics.edit") && <FollowerForm channelId={channel.id} />}
          </section>
        )}

        <section className="space-y-2">
          <h3 className={SECTION_TITLE}>Next 7 days</h3>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing planned.</p>
          ) : (
            <ul className="space-y-2">
              {upcoming.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onClose(); // Two sheets at once fight over focus.
                      openDetailDrawer(post);
                    }}
                    className="flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm hover:border-primary/50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{post.title}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatShortDate(post.publish_date)}
                        {post.publish_time && ` · ${post.publish_time}`}
                      </span>
                    </span>
                    <ContentStatusBadge status={post.status} className="shrink-0" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </ResponsiveModal>
  );
}

function FollowerForm({ channelId }: { channelId: string }) {
  const { onAddSnapshot } = useWorkspace();
  const [followers, setFollowers] = useState("");
  const [date, setDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setIsSaving(true);
      await onAddSnapshot({ channel_id: channelId, followers: Number(followers), captured_at: date });
      setFollowers("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save followers");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
        <Input
          aria-label="Follower count"
          type="number"
          min="0"
          inputMode="numeric"
          placeholder="Follower count"
          value={followers}
          onChange={(e) => setFollowers(e.target.value)}
          className={CONTROL_HEIGHT}
          required
        />
        <ResponsiveDatePicker aria-label="Counted on" value={date} onChange={setDate} clearable={false} />
        <Button type="submit" variant="outline" disabled={isSaving || followers === ""} className={CONTROL_HEIGHT}>
          {isSaving ? "Saving..." : "Log count"}
        </Button>
      </div>
      {error && <FormError>{error}</FormError>}
    </form>
  );
}
