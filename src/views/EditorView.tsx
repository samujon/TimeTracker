"use client";

import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { useClickOutside } from "@/hooks/useClickOutside";
import { fetchExportData } from "@/lib/exportData";
import { generateCSV, downloadCSV } from "@/lib/csvUtils";
import { SetupScreen } from "./SetupScreen";
import { EditEntryModal } from "@/components/shared/EditEntryModal";
import { useUser } from "@/context/UserContext";
import type { TimeEntry, Project, Tag } from "@/types";
import {
  extractProjectFields,
  extractTagsFromJoin,
  formatLocalDate,
  formatLocalTime,
  formatHoursMinutes,
  toggleArrayId,
  computeEffectiveTags,
  normaliseEntry,
} from "@/lib/timeUtils";

const PAGE_SIZE = 25;

export function EditorView() {
  const supabase = getSupabaseClient();
  const { user } = useUser();

  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingInProgress, setDeletingInProgress] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ─── Export ───────────────────────────────────────────────────────────────
  const [exportOpen, setExportOpen] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const closeExport = useCallback(() => setExportOpen(false), []);
  useClickOutside(exportDropdownRef, closeExport, exportOpen);

  const exportPresets = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7)); // Monday
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const yearEnd = new Date(now.getFullYear() + 1, 0, 1);
    const month = now.toLocaleString("en-US", { month: "short" }).toLowerCase();
    return [
      { label: "This week", from: weekStart.toISOString(), to: weekEnd.toISOString(), filename: `time-entries-week-${weekStart.toISOString().slice(0, 10)}.csv` },
      { label: "This month", from: monthStart.toISOString(), to: monthEnd.toISOString(), filename: `time-entries-${now.getFullYear()}-${month}.csv` },
      { label: "This year", from: yearStart.toISOString(), to: yearEnd.toISOString(), filename: `time-entries-${now.getFullYear()}.csv` },
      { label: "All time", from: null, to: null, filename: "time-entries-all.csv" },
    ];
  }, []);

  async function handleExport(preset: { label: string; from: string | null; to: string | null; filename: string }) {
    setExportOpen(false);
    setExportLoading(true);
    setExportError(null);
    try {
      const rows = await fetchExportData(preset.from, preset.to, user?.id);
      if (rows.length === 0) {
        setExportError("No entries found for that period.");
      } else {
        downloadCSV(generateCSV(rows), preset.filename);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExportLoading(false);
    }
  }

  // ─── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

  // ─── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase || !user) return;
    void loadInitial();
    void loadProjectsAndTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase, user?.id]);

  async function loadInitial() {
    setLoading(true);
    await fetchEntries(0, true);
    setLoading(false);
  }

  async function fetchEntries(offset: number, replace: boolean) {
    const { data, error: err, count } = await supabase!
      .from("time_entries")
      .select(
        "id, description, project_id, started_at, ended_at, duration_seconds, " +
          "projects(name, color), " +
          "entry_tags(tags(id, name, color))",
        { count: "exact" }
      )
      .eq("user_id", user!.id)
      .order("started_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (err) {
      setError(err.message);
      return;
    }

    const normalised = ((data ?? []) as unknown as Record<string, unknown>[]).map(normaliseEntry);

    setEntries((prev) => (replace ? normalised : [...prev, ...normalised]));
    if (count !== null) setTotalCount(count);
  }

  async function loadProjectsAndTags() {
    const [pr, tr] = await Promise.all([
      supabase!
        .from("projects")
        .select("id, name, color, project_tags(tags(id, name, color))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: true }),
      supabase!.from("tags").select("id, name, color").eq("user_id", user!.id).order("created_at", { ascending: true }),
    ]);

    if (!pr.error) {
      setProjects(
        ((pr.data ?? []) as unknown as Record<string, unknown>[]).map((p) => ({
          ...(p as unknown as Omit<Project, "tags">),
          tags: extractTagsFromJoin(p.project_tags),
        }))
      );
    }
    if (!tr.error) setAllTags((tr.data ?? []) as unknown as Tag[]);
  }

  // ─── Load more ────────────────────────────────────────────────────────────
  async function handleLoadMore() {
    setLoadingMore(true);
    await fetchEntries(entries.length, false);
    setLoadingMore(false);
  }

  // ─── Filtered entries (client-side) ───────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (q && !(e.description ?? "").toLowerCase().includes(q)) return false;
      if (filterProjectId && e.project_id !== filterProjectId) return false;
      if (filterTagIds.length > 0) {
        const project = projects.find((p) => p.id === e.project_id);
        const effectiveTagIds = computeEffectiveTags(e, project).map((t) => t.id);
        if (!filterTagIds.some((id) => effectiveTagIds.includes(id))) return false;
      }
      return true;
    });
  }, [entries, projects, search, filterProjectId, filterTagIds]);

  // ─── Edit / save ──────────────────────────────────────────────────────────
  async function insertEntryTags(entryId: string, tagIds: string[]): Promise<Tag[]> {
    if (tagIds.length === 0) return [];
    const { error: err } = await supabase!
      .from("entry_tags")
      .insert(tagIds.map((tag_id) => ({ entry_id: entryId, tag_id })));
    if (err) {
      setError(err.message);
      return [];
    }
    return allTags.filter((t) => tagIds.includes(t.id));
  }

  async function handleSaveEntry(update: {
    id: string;
    description: string;
    project_id: string;
    started_at: string;
    ended_at: string;
    entry_tag_ids: string[];
  }) {
    const { data, error: err } = await supabase!
      .from("time_entries")
      .update({
        description: update.description,
        project_id: update.project_id,
        started_at: update.started_at,
        ended_at: update.ended_at,
      })
      .eq("id", update.id)
      .select(
        "id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)"
      )
      .single();

    if (err) {
      setError(err.message);
      throw err;
    }

    if (data) {
      const { error: delErr } = await supabase!
        .from("entry_tags")
        .delete()
        .eq("entry_id", update.id);
      if (delErr) {
        setError(delErr.message);
        throw delErr;
      }
      const entryTags = await insertEntryTags(update.id, update.entry_tag_ids);
      setEntries((prev) =>
        prev.map((e) =>
          e.id === update.id
            ? {
                ...(data as unknown as Omit<
                  TimeEntry,
                  "project_name" | "project_color" | "entry_tags"
                >),
                ...extractProjectFields(
                  (data as unknown as Record<string, unknown>).projects
                ),
                entry_tags: entryTags,
              }
            : e
        )
      );
      setEditingEntry(null);
    }
  }

  // ─── Delete ───────────────────────────────────────────────────────────────
  async function handleConfirmDelete(id: string) {
    setDeletingInProgress(true);
    const { error: err } = await supabase!.from("time_entries").delete().eq("id", id);
    setDeletingInProgress(false);
    if (err) {
      setError(err.message);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
      setTotalCount((n) => n - 1);
      setDeletingId(null);
    }
  }

  // ─── Create tag ───────────────────────────────────────────────────────────
  async function handleCreateTag(name: string, color: string) {
    const { data, error: err } = await supabase!
      .from("tags")
      .insert({ name, color, user_id: user!.id })
      .select("id, name, color")
      .single();
    if (err) setError(err.message);
    else if (data) setAllTags((prev) => [...prev, data as unknown as Tag]);
  }

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (!hasSupabaseEnv) return <SetupScreen />;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-[var(--color-destructive-light)] border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-destructive)]">
          {error}
        </p>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by description…"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-[var(--color-text-secondary)]">Project</label>
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)] focus:border-[var(--color-primary)]"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        {/* Export dropdown */}
        <div className="relative self-end" ref={exportDropdownRef}>
          <button
            onClick={() => setExportOpen((o) => !o)}
            disabled={exportLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors"
            aria-haspopup="listbox"
            aria-expanded={exportOpen}
          >
            {exportLoading ? (
              <>
                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
                Exporting…
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path d="M8 1v9M4 7l4 4 4-4M2 13h12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Export CSV
              </>
            )}
          </button>
          {exportOpen && (
            <div
              role="listbox"
              className="absolute right-0 mt-1 w-44 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg z-20 py-1 text-sm"
            >
              {exportPresets.map((preset) => (
                <button
                  key={preset.label}
                  role="option"
                  onClick={() => void handleExport(preset)}
                  className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {exportError && (
        <p className="text-sm text-[var(--color-destructive)]">{exportError}</p>
      )}

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-[var(--color-text-secondary)] mr-1">Tags:</span>
          {allTags.map((tag) => {
            const active = filterTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => setFilterTagIds((prev) => toggleArrayId(prev, tag.id))}
                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium transition-all
                  ${active ? "opacity-100 ring-2 ring-offset-1 ring-offset-[var(--color-bg)] ring-[var(--color-border)]" : "opacity-60 hover:opacity-90"}`}
                style={{
                  backgroundColor: tag.color ? tag.color + "33" : "#6366f133",
                  color: tag.color ?? "#6366f1",
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: tag.color ?? "#6366f1" }}
                />
                {tag.name}
              </button>
            );
          })}
          {filterTagIds.length > 0 && (
            <button
              onClick={() => setFilterTagIds([])}
              className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] ml-1 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Entry count summary ── */}
      {!loading && (
        <p className="text-xs text-[var(--color-text-muted)]">
          {filtered.length !== entries.length
            ? `${filtered.length} of ${entries.length} loaded entries`
            : `${entries.length} of ${totalCount} entries loaded`}
        </p>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          Loading entries…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-[var(--color-text-muted)]">
          {entries.length === 0 ? "No entries yet." : "No entries match your filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)] text-left">
                <th className="px-3 py-2 font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Date</th>
                <th className="px-3 py-2 font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Start – End</th>
                <th className="px-3 py-2 font-medium text-[var(--color-text-secondary)] whitespace-nowrap">Duration</th>
                <th className="px-3 py-2 font-medium text-[var(--color-text-secondary)]">Project</th>
                <th className="px-3 py-2 font-medium text-[var(--color-text-secondary)]">Description</th>
                <th className="px-3 py-2 font-medium text-[var(--color-text-secondary)]">Tags</th>
                <th className="px-3 py-2 font-medium text-[var(--color-text-secondary)] sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
              {filtered.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  project={projects.find((p) => p.id === entry.project_id)}
                  isDeleting={deletingId === entry.id}
                  isDeletingInProgress={deletingInProgress && deletingId === entry.id}
                  onEdit={() => setEditingEntry(entry)}
                  onDeleteRequest={() => setDeletingId(entry.id)}
                  onDeleteConfirm={() => void handleConfirmDelete(entry.id)}
                  onDeleteCancel={() => setDeletingId(null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Load more ── */}
      {!loading && entries.length < totalCount && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => void handleLoadMore()}
            disabled={loadingMore}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-2 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors"
          >
            {loadingMore ? "Loading…" : `Load more (${totalCount - entries.length} remaining)`}
          </button>
        </div>
      )}

      {/* ── Edit modal ── */}
      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          projects={projects}
          tags={allTags}
          onCreateTag={handleCreateTag}
          onSave={handleSaveEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

// ─── EntryRow sub-component ─────────────────────────────────────────────────

type EntryRowProps = {
  entry: TimeEntry;
  project?: Project;
  isDeleting: boolean;
  isDeletingInProgress: boolean;
  onEdit: () => void;
  onDeleteRequest: () => void;
  onDeleteConfirm: () => void;
  onDeleteCancel: () => void;
};

function EntryRow({
  entry,
  project,
  isDeleting,
  isDeletingInProgress,
  onEdit,
  onDeleteRequest,
  onDeleteConfirm,
  onDeleteCancel,
}: EntryRowProps) {
  const effectiveTags = computeEffectiveTags(entry, project);
  const entryTagIds = new Set((entry.entry_tags ?? []).map((t) => t.id));
  const startDate = entry.started_at ? new Date(entry.started_at) : null;
  const endDate = entry.ended_at ? new Date(entry.ended_at) : null;

  const dateStr = startDate ? formatLocalDate(startDate) : "—";
  const startStr = startDate ? formatLocalTime(startDate) : "—";
  const endStr = endDate ? formatLocalTime(endDate) : "—";
  const durationStr = entry.duration_seconds != null
    ? formatHoursMinutes(Math.round(entry.duration_seconds / 60))
    : "—";

  return (
    <tr className="group hover:bg-[var(--color-surface-alt)] transition-colors">
      <td className="px-3 py-2 text-[var(--color-text-secondary)] whitespace-nowrap tabular-nums">
        {dateStr}
      </td>
      <td className="px-3 py-2 text-[var(--color-text-secondary)] whitespace-nowrap tabular-nums">
        {startStr}&thinsp;–&thinsp;{endStr}
      </td>
      <td className="px-3 py-2 text-[var(--color-text-muted)] whitespace-nowrap tabular-nums">
        {durationStr}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {entry.project_name ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.project_color ?? "#34d399" }}
            />
            <span className="text-[var(--color-text)]">{entry.project_name}</span>
          </span>
        ) : (
          <span className="text-[var(--color-text-muted)]">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-[var(--color-text)] max-w-[16rem] truncate">
        {entry.description || <span className="text-[var(--color-text-muted)] italic">No description</span>}
      </td>
      <td className="px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {effectiveTags.map((tag) => {
            const inherited = !entryTagIds.has(tag.id);
            return (
              <span
                key={tag.id}
                title={inherited ? "Inherited from project" : undefined}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                  inherited ? "opacity-60 ring-1 ring-inset" : ""
                }`}
                style={{
                  backgroundColor: tag.color ? tag.color + "22" : "#6366f122",
                  color: tag.color ?? "#6366f1",
                  ...(inherited ? { outline: `1px solid ${tag.color ?? "#6366f1"}`, outlineOffset: "-1px" } : {}),
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: tag.color ?? "#6366f1" }}
                />
                {tag.name}
              </span>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {isDeleting ? (
          <span className="inline-flex items-center gap-2 text-xs">
            <span className="text-[var(--color-text-muted)]">Delete?</span>
            <button
              onClick={onDeleteConfirm}
              disabled={isDeletingInProgress}
              className="rounded-md px-2 py-0.5 bg-[var(--color-destructive)] text-white hover:opacity-90 disabled:opacity-50 transition-colors"
            >
              {isDeletingInProgress ? "…" : "Yes"}
            </button>
            <button
              onClick={onDeleteCancel}
              disabled={isDeletingInProgress}
              className="rounded-md px-2 py-0.5 bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg)] disabled:opacity-50 transition-colors"
            >
              No
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="rounded-md px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDeleteRequest}
              className="rounded-md px-2 py-0.5 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-destructive-light)] hover:text-[var(--color-destructive)] transition-colors"
            >
              Delete
            </button>
          </span>
        )}
      </td>
    </tr>
  );
}
