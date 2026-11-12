"use client";

import React, { useState } from "react";
import { format } from "date-fns";
import { Archive, Pencil, PieChart, Plus, Tags } from "lucide-react";
import { ActionButton } from "@/components/shared/action-button";
import { CardList } from "@/components/shared/card-list";
import { useConfirm } from "@/components/shared/confirm-dialog";
import { DataColumn, DataTable } from "@/components/shared/data-table";
import { EmptyState, NoData } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { CONTROL_HEIGHT, Field, FieldRow, FormActions, FormError, FormSection } from "@/components/ui/form-layout";
import { Input } from "@/components/ui/input";
import { ResponsiveModal } from "@/components/ui/responsive-modal";
import { ResponsiveSelect } from "@/components/ui/responsive-select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useWorkspace } from "@/context/workspace-context";
import { useIsDesktop } from "@/hooks/use-media-query";
import { TYPE_COLORS, TYPE_FORMATS, typeMix } from "@/lib/settings-rules";
import { ContentTypeConfig } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TYPE_COLOR_CLASSES, TypeBadge } from "./type-badge";

// Within 5 points of the target counts as on target, as on the Dashboard.
const TOLERANCE = 5;

interface TypeRow {
  type: ContentTypeConfig;
  /** Live posts of this type, any date. */
  posts: number;
  monthCount: number;
  monthPct: number;
  offTarget: boolean;
}

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
const formatLabel = (type: ContentTypeConfig) =>
  TYPE_FORMATS.find((f) => f.value === (type.default_format ?? ""))?.label ?? "No default";

export function TaxonomiesManager() {
  const { contentTypes, items, onDeleteContentType, showToast } = useWorkspace();
  const canManage = useAuth().can("types.manage");
  const confirm = useConfirm();
  const isDesktop = useIsDesktop();
  const [editing, setEditing] = useState<ContentTypeConfig | "new" | null>(null);

  const month = format(new Date(), "yyyy-MM");
  const monthLabel = format(new Date(), "MMMM yyyy");
  const mix = typeMix(items, contentTypes, month);
  const targetTotal = contentTypes.reduce((sum, t) => sum + (t.target_share_pct || 0), 0);
  const rows: TypeRow[] = contentTypes.map((type, i) => ({
    type,
    posts: items.filter((item) => item.content_type === type.name && item.status !== "Archived").length,
    monthCount: mix[i].count,
    monthPct: mix[i].actualPct,
    offTarget: mix[i].targetPct > 0 && Math.abs(mix[i].actualPct - mix[i].targetPct) > TOLERANCE,
  }));

  const archive = async ({ type, posts }: TypeRow) => {
    const ok = await confirm({
      title: `Archive "${type.name}"?`,
      description: posts
        ? `Its ${plural(posts, "post")} keep the type, but it can't be picked for new posts.`
        : "No posts use it. It will no longer be offered for new posts.",
      confirmLabel: "Archive type",
    });
    if (!ok) return;
    try {
      await onDeleteContentType(type.id);
      showToast(`"${type.name}" archived`);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to archive content type");
    }
  };

  const actions = (row: TypeRow, showLabel?: boolean) =>
    canManage && (
      <div className={cn("flex items-center gap-1", showLabel ? "gap-2 *:flex-1" : "justify-end")}>
        <ActionButton icon={<Pencil />} label="Edit" onClick={() => setEditing(row.type)} showLabel={showLabel} variant={showLabel ? "outline" : "ghost"} />
        <ActionButton icon={<Archive />} label="Archive" onClick={() => archive(row)} showLabel={showLabel} variant={showLabel ? "outline" : "ghost"} />
      </div>
    );

  const thisMonth = (row: TypeRow) => (
    <span className={cn("tabular-nums", row.offTarget ? "text-amber-700 dark:text-amber-400" : "text-foreground")}>
      {plural(row.monthCount, "post")} · {row.monthPct}%
    </span>
  );

  const columns: DataColumn<TypeRow>[] = [
    {
      key: "type",
      header: "Type",
      cell: (row) => (
        <div className="min-w-0 space-y-1 py-0.5">
          <TypeBadge name={row.type.name} />
          <p className="line-clamp-2 text-xs whitespace-normal text-muted-foreground">{row.type.description || "No description."}</p>
        </div>
      ),
    },
    {
      key: "target",
      header: "Target share",
      className: "w-28",
      cell: (row) => (row.type.target_share_pct ? `${row.type.target_share_pct}%` : <span className="text-muted-foreground">None</span>),
    },
    { key: "month", header: "This month", className: "w-36", cell: thisMonth },
    { key: "format", header: "Default format", className: "w-36", cell: (row) => formatLabel(row.type) },
    { key: "posts", header: "Posts", className: "w-20", align: "right", cell: (row) => <span className="tabular-nums">{row.posts}</span> },
    ...(canManage
      ? [
          {
            key: "actions",
            header: <span className="sr-only">Actions</span>,
            className: "w-24",
            align: "right" as const,
            interactive: true,
            cell: (row: TypeRow) => actions(row),
          },
        ]
      : []),
  ];

  const empty = (
    <NoData
      icon={<Tags />}
      title="No content types yet"
      description="Types like Educational or Promotional organize your posts and drive the content mix."
      action={
        canManage && (
          <Button onClick={() => setEditing("new")} className="gap-2">
            <Plus className="h-4 w-4" /> Add content type
          </Button>
        )
      }
    />
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Content Types"
        description="The kinds of content you plan, with a color, a target share of each month, and a starting brief."
        actions={
          canManage && (
            <Button onClick={() => setEditing("new")} className="gap-2 font-medium">
              <Plus className="h-4 w-4" />
              <span>Add Content Type</span>
            </Button>
          )
        }
      />

      <Card className="gap-4 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Content mix · {monthLabel}</h2>
            <p className="text-xs text-muted-foreground">Each type&apos;s share of this month&apos;s posts. The tick marks its target.</p>
          </div>
          {targetTotal !== 100 && targetTotal > 0 && (
            <span className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Targets add up to {targetTotal}%, not 100%
            </span>
          )}
        </div>
        {rows.length === 0 ? (
          <EmptyState size="sm" icon={<PieChart />} title="No mix to show yet" description="Add content types to compare this month's mix with your targets." />
        ) : (
          <ul className="grid gap-x-8 gap-y-3.5 md:grid-cols-2">
            {rows.map((row) => (
              <li key={row.type.id} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <TypeBadge name={row.type.name} />
                  <span className="text-muted-foreground tabular-nums">
                    <span className="font-medium text-foreground">{row.monthPct}%</span>
                    {row.type.target_share_pct ? ` of ${row.type.target_share_pct}% target` : " · no target"}
                  </span>
                </div>
                <div
                  role="meter"
                  aria-label={`${row.type.name}: ${row.monthPct}%${row.type.target_share_pct ? `, target ${row.type.target_share_pct}%` : ""}`}
                  aria-valuenow={row.monthPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  className="relative h-1.5 rounded-full bg-muted"
                >
                  <div
                    className={cn("h-full rounded-full", row.offTarget ? "bg-amber-500" : "bg-primary")}
                    style={{ width: `${Math.min(100, row.monthPct)}%` }}
                  />
                  {!!row.type.target_share_pct && (
                    <span
                      aria-hidden
                      className="absolute -top-1 h-3.5 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
                      style={{ left: `${Math.min(100, row.type.target_share_pct)}%` }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Table from 1280px up, cards below. Only one is rendered, chosen with a media query. */}
      {isDesktop ? (
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(row) => row.type.id}
          onRowClick={canManage ? (row) => setEditing(row.type) : undefined}
          empty={empty}
        />
      ) : (
        <CardList
          rows={rows}
          getRowKey={(row) => row.type.id}
          empty={empty}
          renderCard={(row) => (
            <Card className="flex h-full flex-col gap-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <TypeBadge name={row.type.name} className="text-sm" />
                <span className="shrink-0 text-xs text-muted-foreground">{plural(row.posts, "post")}</span>
              </div>
              <p className="line-clamp-3 flex-1 text-sm text-muted-foreground">{row.type.description || "No description."}</p>
              <dl className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <dt className="text-muted-foreground">Target</dt>
                  <dd className="font-medium text-foreground">{row.type.target_share_pct ? `${row.type.target_share_pct}%` : "None"}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">This month</dt>
                  <dd className="font-medium">{thisMonth(row)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Format</dt>
                  <dd className="font-medium text-foreground">{formatLabel(row.type)}</dd>
                </div>
              </dl>
              {actions(row, true)}
            </Card>
          )}
        />
      )}

      {editing && <TypeDialog type={editing === "new" ? null : editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

function TypeDialog({ type, onClose }: { type: ContentTypeConfig | null; onClose: () => void }) {
  const { items, contentTypes, onAddContentType, onUpdateContentType } = useWorkspace();
  const [name, setName] = useState(type?.name ?? "");
  const [description, setDescription] = useState(type?.description ?? "");
  const [color, setColor] = useState(type?.badge_color ?? "");
  const [target, setTarget] = useState(type?.target_share_pct ? String(type.target_share_pct) : "");
  const [defaultFormat, setDefaultFormat] = useState(type?.default_format ?? "");
  const [brief, setBrief] = useState(type?.brief_template ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const renaming = type && name.trim() && name.trim() !== type.name;
  const othersTotal = contentTypes.filter((t) => t.id !== type?.id).reduce((sum, t) => sum + (t.target_share_pct || 0), 0);
  const affected = type ? items.filter((i) => i.content_type === type.name).length : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const fields = {
      name: name.trim(),
      description: description.trim(),
      badge_color: color,
      target_share_pct: target === "" ? undefined : Number(target),
      default_format: defaultFormat,
      brief_template: brief,
    };
    try {
      setIsSaving(true);
      if (type) await onUpdateContentType({ ...type, ...fields, target_share_pct: fields.target_share_pct ?? 0 });
      else await onAddContentType(fields);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save content type");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ResponsiveModal
      open
      onClose={onClose}
      size="lg"
      title={type ? "Edit content type" : "New content type"}
      description="Types appear in the post form and the content mix."
      footer={
        <div className="space-y-3">
          {error && <FormError>{error}</FormError>}
          <FormActions>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
            <Button type="submit" form="type-form" disabled={isSaving}>{isSaving ? "Saving..." : "Save type"}</Button>
          </FormActions>
        </div>
      }
    >
      <form id="type-form" onSubmit={submit} className="space-y-6">
        <FormSection title="Basics">
          <Field label="Name" htmlFor="type-name" required>
            <Input
              id="type-name"
              className={CONTROL_HEIGHT}
              placeholder="e.g. Case Study"
              value={name}
              autoCapitalize="words"
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          {renaming && affected > 0 && (
            <p className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
              Renaming also updates the {affected} post{affected === 1 ? "" : "s"} that use &quot;{type?.name}&quot;.
            </p>
          )}
          <Field label="Description" htmlFor="type-description">
            <Textarea
              id="type-description"
              rows={2}
              placeholder="When creators should use this type..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none"
            />
          </Field>
          <Field label="Color">
            <div role="radiogroup" aria-label="Color" className="flex flex-wrap gap-2">
              {["", ...TYPE_COLORS].map((option) => (
                <button
                  key={option || "none"}
                  type="button"
                  role="radio"
                  aria-checked={color === option}
                  aria-label={option || "No color"}
                  title={option || "No color"}
                  onClick={() => setColor(option)}
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full border-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50 md:h-8 md:w-8",
                    color === option ? "border-foreground" : "border-transparent"
                  )}
                >
                  <span className={cn("h-7 w-7 rounded-full md:h-5 md:w-5", option ? TYPE_COLOR_CLASSES[option].swatch : "border bg-muted")} />
                </button>
              ))}
            </div>
          </Field>
        </FormSection>

        <FormSection title="Planning defaults">
          <FieldRow>
            <Field label="Target share" htmlFor="type-target" hint={othersTotal > 0 ? `${Math.max(0, 100 - othersTotal)}% left after other types` : "% of monthly posts"}>
              <Input
                id="type-target"
                type="number"
                min="0"
                max="100"
                inputMode="numeric"
                className={CONTROL_HEIGHT}
                placeholder="e.g. 40"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </Field>
            <Field label="Default format" htmlFor="type-format">
              <ResponsiveSelect
                id="type-format"
                value={defaultFormat}
                onValueChange={setDefaultFormat}
                options={TYPE_FORMATS.map((f) => ({ value: f.value, label: f.label }))}
              />
            </Field>
          </FieldRow>
          <Field label="Brief template" htmlFor="type-brief" hint="Starts the caption of new posts">
            <Textarea
              id="type-brief"
              rows={4}
              placeholder={"Hook:\nKey points:\nCall to action:"}
              value={brief}
              onChange={(e) => setBrief(e.target.value)}
              className="resize-none"
            />
          </Field>
        </FormSection>
      </form>
    </ResponsiveModal>
  );
}
