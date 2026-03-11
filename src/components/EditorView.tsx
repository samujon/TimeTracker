"use client";

import { useEffect, useState, useMemo } from "react";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { SetupScreen } from "./SetupScreen";
import { EditEntryModal } from "./EditEntryModal";
import type { TimeEntry, Project, Tag } from "@/types";
import {
  extractProjectFields,
  extractTagsFromJoin,
  formatLocalDate,
  formatLocalTime,
  formatHoursMinutes,
  toggleArrayId,
  computeEffectiveTags,
} from "@/lib/timeUtils";

const PAGE_SIZE = 25;

function normaliseEntry(raw: Record<string, unknown>): TimeEntry {
  return {
    ...(raw as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
    ...extractProjectFields(raw.projects),
    entry_tags: extractTagsFromJoin(raw.entry_tags),
  };
}

export function EditorView() {
  const supabase = getSupabaseClient();

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

  // ─── Filters ──────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [filterProjectId, setFilterProjectId] = useState("");
  const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

  // ─── Initial data load ────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) return;
    void loadInitial();
    void loadProjectsAndTags();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

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
        .order("created_at", { ascending: true }),
      supabase!.from("tags").select("id, name, color").order("created_at", { ascending: true }),
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
      .insert({ name, color })
      .select("id, name, color")
      .single();
    if (err) setError(err.message);
    else if (data) setAllTags((prev) => [...prev, data as unknown as Tag]);
  }

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (!hasSupabaseEnv) return <SetupScreen />;

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5">
      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 px-4 py-2 text-sm text-red-700 dark:text-red-300">
          {error}
        </p>
      )}

      {/* ── Filter bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:flex-wrap">
        {/* Description search */}
        <div className="flex flex-col gap-1 min-w-0 flex-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by description…"
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          />
        </div>

        {/* Project filter */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Project</label>
          <select
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-emerald-400"
          >
            <option value="">All projects</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-1">Tags:</span>
          {allTags.map((tag) => {
            const active = filterTagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => setFilterTagIds((prev) => toggleArrayId(prev, tag.id))}
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium transition-all
                  ${active ? "opacity-100 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 ring-zinc-400 dark:ring-zinc-500" : "opacity-60 hover:opacity-90"}`}
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
              className="text-xs text-zinc-400 dark:text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 ml-1 underline"
            >
              Clear
            </button>
          )}
        </div>
      )}

      {/* ── Entry count summary ── */}
      {!loading && (
        <p className="text-xs text-zinc-400 dark:text-zinc-500">
          {filtered.length !== entries.length
            ? `${filtered.length} of ${entries.length} loaded entries`
            : `${entries.length} of ${totalCount} entries loaded`}
        </p>
      )}

      {/* ── Table ── */}
      {loading ? (
        <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
          Loading entries…
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500">
          {entries.length === 0 ? "No entries yet." : "No entries match your filters."}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-left">
                <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Date</th>
                <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Start – End</th>
                <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Duration</th>
                <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Project</th>
                <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Description</th>
                <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400">Tags</th>
                <th className="px-3 py-2 font-medium text-zinc-500 dark:text-zinc-400 sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
            className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-5 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 disabled:opacity-50 transition-colors"
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
    <tr className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 whitespace-nowrap tabular-nums">
        {dateStr}
      </td>
      <td className="px-3 py-2 text-zinc-600 dark:text-zinc-300 whitespace-nowrap tabular-nums">
        {startStr}&thinsp;–&thinsp;{endStr}
      </td>
      <td className="px-3 py-2 text-zinc-500 dark:text-zinc-400 whitespace-nowrap tabular-nums">
        {durationStr}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {entry.project_name ? (
          <span className="inline-flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: entry.project_color ?? "#34d399" }}
            />
            <span className="text-zinc-700 dark:text-zinc-200">{entry.project_name}</span>
          </span>
        ) : (
          <span className="text-zinc-400 dark:text-zinc-500">—</span>
        )}
      </td>
      <td className="px-3 py-2 text-zinc-700 dark:text-zinc-200 max-w-[16rem] truncate">
        {entry.description || <span className="text-zinc-400 dark:text-zinc-500 italic">No description</span>}
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
                  ...(inherited ? { ringColor: tag.color ?? "#6366f1" } : {}),
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
            <span className="text-zinc-500 dark:text-zinc-400">Delete?</span>
            <button
              onClick={onDeleteConfirm}
              disabled={isDeletingInProgress}
              className="rounded px-2 py-0.5 bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isDeletingInProgress ? "…" : "Yes"}
            </button>
            <button
              onClick={onDeleteCancel}
              disabled={isDeletingInProgress}
              className="rounded px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
            >
              No
            </button>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={onEdit}
              className="rounded px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={onDeleteRequest}
              className="rounded px-2 py-0.5 text-xs bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              Delete
            </button>
          </span>
        )}
      </td>
    </tr>
  );
}
