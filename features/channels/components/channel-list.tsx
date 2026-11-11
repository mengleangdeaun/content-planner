"use client";

import React, { useState } from "react";
import { ChannelAccount } from "@/lib/types";
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
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Plus, ExternalLink, Edit, Trash2 } from "lucide-react";
import { ChannelModal } from "./channel-modal";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { UpgradeSheetButton } from "@/features/integrations";

interface ChannelListProps {
  channels?: ChannelAccount[];
  onSaveChannel?: (channel: Omit<ChannelAccount, "id"> & { id?: string }) => Promise<void>;
  onDeleteChannel?: (id: string) => Promise<void>;
}

export function ChannelList(props: ChannelListProps) {
  const workspace = useWorkspace();
  const canManage = useAuth().can("channels.manage");
  const channels = props.channels ?? workspace.channels;
  const onSaveChannel = props.onSaveChannel ?? workspace.onSaveChannel;
  const onDeleteChannel = props.onDeleteChannel ?? workspace.onDeleteChannel;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState<ChannelAccount | null>(null);

  const handleOpenAdd = () => {
    setEditingChannel(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (channel: ChannelAccount) => {
    setEditingChannel(channel);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Channel Accounts
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure your brand profiles, publishing handles, and weekly target benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <UpgradeSheetButton />
          {canManage && (
            <Button onClick={handleOpenAdd} size="default" className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Channel Account</span>
            </Button>
          )}
        </div>
      </div>

      {/* Channels Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-28">ID</TableHead>
            <TableHead className="w-48">Platform & Page</TableHead>
            <TableHead className="w-36">Handle</TableHead>
            <TableHead className="w-32 text-center">Weekly Target</TableHead>
            <TableHead className="w-28">Status</TableHead>
            <TableHead className="min-w-[200px]">Strategy Notes</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {channels.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-32 text-center text-muted-foreground text-sm">
                No channels configured yet. Click &quot;Add Channel Account&quot; to create one.
              </TableCell>
            </TableRow>
          ) : (
            channels.map((ch) => (
              <TableRow key={ch.id}>
                <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                  {ch.id}
                </TableCell>

                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-8 w-8">
                      {ch.avatar_url && (
                        <AvatarImage src={ch.avatar_url} alt={ch.account_name} />
                      )}
                      <AvatarFallback className="text-[10px] font-bold">
                        {ch.account_name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="font-semibold text-foreground text-sm block">
                        {ch.account_name}
                      </span>
                      <span className="text-xs text-muted-foreground">{ch.platform}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="text-xs font-medium">
                  {ch.page_url ? (
                    <a
                      href={ch.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 inline-flex"
                    >
                      <span>{ch.handle || ch.account_name}</span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ) : (
                    <span>{ch.handle || "—"}</span>
                  )}
                </TableCell>

                <TableCell className="text-center font-bold text-sm">
                  {ch.weekly_target_quota} / wk
                </TableCell>

                <TableCell>
                  <Badge
                    variant={
                      ch.status === "Active"
                        ? "default"
                        : ch.status === "Paused"
                        ? "secondary"
                        : "outline"
                    }
                    className="text-xs font-medium"
                  >
                    {ch.status}
                  </Badge>
                </TableCell>

                <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                  {ch.notes || "—"}
                </TableCell>

                <TableCell className="text-right">
                  {canManage && (
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(ch)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteChannel(ch.id)}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {isModalOpen && (
        <ChannelModal
          isOpen
          onClose={() => setIsModalOpen(false)}
          onSave={onSaveChannel}
          channelToEdit={editingChannel}
        />
      )}
    </div>
  );
}

