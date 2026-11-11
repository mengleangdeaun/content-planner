"use client";

import React, { useState } from "react";
import { ContentTypeConfig } from "@/lib/types";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit2 } from "lucide-react";
import { useWorkspace } from "@/context/workspace-context";
import { useAuth } from "@/context/auth-context";
import { UpgradeSheetButton } from "@/features/integrations";

interface TaxonomiesManagerProps {
  contentTypes?: ContentTypeConfig[];
  onAddContentType?: (item: Omit<ContentTypeConfig, "id">) => Promise<void>;
  onDeleteContentType?: (id: string) => Promise<void>;
  onUpdateContentType?: (item: ContentTypeConfig) => Promise<void>;
}

export function TaxonomiesManager(props: TaxonomiesManagerProps) {
  const workspace = useWorkspace();
  const canManage = useAuth().can("types.manage");
  const contentTypes = props.contentTypes ?? workspace.contentTypes;
  const onAddContentType = props.onAddContentType ?? workspace.onAddContentType;
  const onDeleteContentType = props.onDeleteContentType ?? workspace.onDeleteContentType;
  const onUpdateContentType = props.onUpdateContentType ?? workspace.onUpdateContentType;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<ContentTypeConfig | null>(null);

  const [typeName, setTypeName] = useState("");
  const [typeDesc, setTypeDesc] = useState("");

  const handleOpenAdd = () => {
    setEditingType(null);
    setTypeName("");
    setTypeDesc("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ct: ContentTypeConfig) => {
    setEditingType(ct);
    setTypeName(ct.name);
    setTypeDesc(ct.description || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typeName.trim()) return;

    if (editingType && onUpdateContentType) {
      await onUpdateContentType({
        ...editingType,
        name: typeName.trim(),
        description: typeDesc.trim(),
      });
    } else {
      await onAddContentType({
        name: typeName.trim(),
        description: typeDesc.trim(),
      });
    }

    setTypeName("");
    setTypeDesc("");
    setEditingType(null);
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Content Taxonomies
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Create and organize editorial content types (e.g. Educational, Promotional, Behind the Scenes) available in the planning dropdown.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <UpgradeSheetButton />
          {canManage && (
            <Button onClick={handleOpenAdd} size="default" className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Content Type</span>
            </Button>
          )}
        </div>
      </div>

      {/* Content Types Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-32">ID</TableHead>
            <TableHead className="w-64">Content Type Name</TableHead>
            <TableHead className="min-w-[280px]">Description & Usage Intent</TableHead>
            <TableHead className="w-28 text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contentTypes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="h-32 text-center text-muted-foreground text-sm">
                No content types configured yet. Click &quot;Add Content Type&quot; above to create one.
              </TableCell>
            </TableRow>
          ) : (
            contentTypes.map((ct) => (
              <TableRow key={ct.id}>
                <TableCell className="font-mono text-xs font-semibold text-muted-foreground">
                  {ct.id}
                </TableCell>

                <TableCell>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {ct.name}
                  </Badge>
                </TableCell>

                <TableCell className="text-sm text-muted-foreground">
                  {ct.description || "No description provided."}
                </TableCell>

                <TableCell className="text-right">
                  {canManage && (
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleOpenEdit(ct)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (confirm(`Delete content type "${ct.name}"?`)) {
                            onDeleteContentType(ct.id);
                          }
                        }}
                        className="h-8 w-8 p-0 hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add / Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-tight">
              {editingType ? "Edit Content Type" : "Add New Content Type"}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              This category will immediately become available in the content scheduling dropdown.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="typeName" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Content Type Name *
              </Label>
              <Input
                id="typeName"
                placeholder="e.g. Industry Analysis, Case Study"
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="typeDesc" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Editorial Intent & Usage
              </Label>
              <Textarea
                id="typeDesc"
                rows={3}
                placeholder="Guidelines for when creators should apply this category..."
                value={typeDesc}
                onChange={(e) => setTypeDesc(e.target.value)}
                className="resize-none"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingType ? "Update Category" : "Save Category"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

