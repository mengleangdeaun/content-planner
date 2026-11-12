"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Plus, Search, Share2 } from "lucide-react";
import { NoData, NoResults } from "@/components/shared/empty-state";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { CONTROL_HEIGHT } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { resolveChannelId } from "@/lib/auth/permissions";
import { channelHealth } from "@/lib/settings-rules";
import { ChannelAccount } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ChannelDetail } from "./channel-detail";
import { ChannelHealthBar } from "./channel-health-bar";
import { ChannelModal } from "./channel-modal";

const ALL = "all";
const NO_BRAND = "none";

export function ChannelList() {
  const { channels, items, people } = useWorkspace();
  const canManage = useAuth().can("channels.manage");
  const [search, setSearch] = useState("");
  const [brand, setBrand] = useState(ALL);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ChannelAccount | "new" | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");
  const brands = [...new Set(channels.map((c) => c.brand).filter(Boolean))].sort() as string[];
  const viewing = channels.find((c) => c.id === viewingId) ?? null;

  const query = search.trim().toLowerCase();
  const visible = channels.filter((c) => {
    if (brand === NO_BRAND ? c.brand : brand !== ALL && c.brand !== brand) return false;
    return !query || [c.account_name, c.handle, c.platform].some((v) => v?.toLowerCase().includes(query));
  });

  const ownerName = (email?: string) => people.find((p) => p.email === email)?.name ?? email;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Channel Accounts"
        description="Your publishing accounts, their weekly targets, and how each one is tracking."
        actions={
          canManage && (
            <Button onClick={() => setEditing("new")} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Channel</span>
            </Button>
          )
        }
      />

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_14rem]">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            aria-label="Search channels"
            placeholder="Search channels..."
            value={search}
            enterKeyHint="search"
            onChange={(e) => setSearch(e.target.value)}
            className={cn("pl-9", CONTROL_HEIGHT)}
          />
        </div>
        <ResponsiveSelect
          aria-label="Filter by brand"
          value={brand}
          onValueChange={setBrand}
          options={[
            { value: ALL, label: "All brands" },
            ...brands.map((b) => ({ value: b, label: b })),
            { value: NO_BRAND, label: "No brand" },
          ]}
        />
      </div>

      {visible.length === 0 ? (
        <Card className="p-0">
          {channels.length === 0 ? (
            <NoData
              icon={<Share2 />}
              title="No channels yet"
              description="Add the social accounts you publish to, with a weekly target for each."
              action={
                canManage && (
                  <Button onClick={() => setEditing("new")} className="gap-2">
                    <Plus className="h-4 w-4" /> Add channel
                  </Button>
                )
              }
            />
          ) : (
            <NoResults
              onClear={() => {
                setSearch("");
                setBrand(ALL);
              }}
            />
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((channel) => {
            const posts = items.filter((item) => resolveChannelId(item, channels) === channel.id);
            return (
              <Card key={channel.id} className="p-0">
                <button
                  type="button"
                  onClick={() => setViewingId(channel.id)}
                  className="flex w-full flex-col gap-3 rounded-xl p-4 text-left outline-none hover:bg-muted/30 focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <div className="flex w-full items-start gap-3">
                    <Avatar className="h-10 w-10">
                      {channel.avatar_url && <AvatarImage src={channel.avatar_url} alt="" />}
                      <AvatarFallback className="text-xs font-bold">
                        {channel.account_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <span className="block truncate font-semibold text-foreground">{channel.account_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {[channel.platform, channel.handle].filter(Boolean).join(" · ")}
                      </span>
                    </div>
                    {channel.status !== "Active" && <Badge variant="secondary">{channel.status}</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {channel.brand && <Badge variant="outline">{channel.brand}</Badge>}
                    {channel.owner_email && (
                      <span className="text-muted-foreground">Owner: {ownerName(channel.owner_email)}</span>
                    )}
                  </div>
                  <div className="w-full">
                    <ChannelHealthBar health={channelHealth(channel, posts, today)} />
                  </div>
                </button>
              </Card>
            );
          })}
        </div>
      )}

      {viewing && (
        <ChannelDetail
          channel={viewing}
          onClose={() => setViewingId(null)}
          onEdit={() => {
            setViewingId(null); // Two sheets at once fight over focus.
            setEditing(viewing);
          }}
        />
      )}
      {editing && <ChannelModal channelToEdit={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
