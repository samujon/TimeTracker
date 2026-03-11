
"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { SetupScreen } from "./SetupScreen";
import { useTimer } from "./useTimer";
import { ProjectSelector } from "./ProjectSelector";
import { TagSelector } from "./TagSelector";
import { ManualEntryForm } from "./ManualEntryForm";
import { RecentEntries } from "./RecentEntries";
import { EditEntryModal } from "./EditEntryModal";
import type { TimeEntry, Project, Tag } from "@/types";
import { MAX_RECENT_ENTRIES, DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { buildHourOptions, formatLocalDate, formatLocalTime, extractProjectFields } from "@/lib/timeUtils";
import type { Theme } from "@/hooks/useTheme";

/**
 * Normalises the `projects` join returned by Supabase — which can be either an
 * array or a single object depending on relationship cardinality — into flat
 * `project_name` / `project_color` strings.
 */

/**
 * Extracts Tag objects from a Supabase nested join result of the shape:
 *   [ { tags: { id, name, color } }, … ]  or  { tags: { id, name, color } }
 */
function extractTagsFromJoin(raw: unknown): Tag[] {
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : [raw];
  const result: Tag[] = [];
  for (const r of rows as Record<string, unknown>[]) {
    const t = r.tags as Record<string, unknown> | null | undefined;
    if (t && typeof t.id === "string" && typeof t.name === "string") {
      result.push({ id: t.id, name: t.name, color: (t.color as string | null | undefined) ?? null });
    }
  }
  return result;
}
export function TimeTracker({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  // ─── Get Supabase client ────────────────────────────────────────────────────
  // getSupabaseClient() returns a singleton — stable across renders.
  const supabase = getSupabaseClient();

  // ─── ALL hooks must be declared before any conditional return ───────────────
  const { isRunning, startedAt, formattedElapsed, start: timerStart, stop: timerStop, reset: timerReset } = useTimer();

  const hourOptions = useMemo(() => buildHourOptions(), []);

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Manual entry state
  const [manualDate, setManualDate] = useState(() => formatLocalDate(new Date()));
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  // Project state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState(DEFAULT_PROJECT_COLOR);
  const [creatingProject, setCreatingProject] = useState(false);

  // Tag state
  const [tags, setTags] = useState<Tag[]>([]);
  /** Entry-specific tags selected for the current timer / manual entry session. */
  const [selectedEntryTagIds, setSelectedEntryTagIds] = useState<string[]>([]);

  useEffect(() => {
    if (!supabase) return;

    const loadEntries = async () => {
      const { data, error: err } = await supabase
        .from("time_entries")
        .select(
          "id, description, project_id, started_at, ended_at, duration_seconds, " +
          "projects(name, color), " +
          "entry_tags(tags(id, name, color))"
        )
        .order("started_at", { ascending: false })
        .limit(MAX_RECENT_ENTRIES);

      if (err) {
        setError(err.message);
      } else {
        setEntries(
          ((data ?? []) as unknown as Record<string, unknown>[]).map((entry) => ({
            ...(entry as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
            ...extractProjectFields(entry.projects),
            entry_tags: extractTagsFromJoin(entry.entry_tags),
          }))
        );
      }
    };

    void loadEntries();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    const loadProjectsAndTags = async () => {
      const [projectsResult, tagsResult] = await Promise.all([
        supabase
          .from("projects")
          .select("id, name, color, project_tags(tags(id, name, color))")
          .order("created_at", { ascending: true }),
        supabase
          .from("tags")
          .select("id, name, color")
          .order("created_at", { ascending: true }),
      ]);

      if (projectsResult.error) {
        setError(projectsResult.error.message);
      } else {
        setProjects(
          ((projectsResult.data ?? []) as unknown as Record<string, unknown>[]).map((p) => ({
            ...(p as unknown as Omit<Project, "tags">),
            tags: extractTagsFromJoin(p.project_tags),
          }))
        );
      }

      if (tagsResult.error) {
        setError(tagsResult.error.message);
      } else {
        setTags(((tagsResult.data ?? []) as unknown as Tag[]));
      }

      setLoading(false);
    };

    void loadProjectsAndTags();
  }, [supabase]);

  // ─── Browser tab title ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      document.title = "Time Tracker";
      return () => { document.title = "Time Tracker"; };
    }
    const projectName = projects.find((p) => p.id === selectedProjectId)?.name ?? null;
    const parts = [projectName, description || null].filter(Boolean).join(" · ");
    document.title = `⏱ ${formattedElapsed}${parts ? ` — ${parts}` : " — Time Tracker"}`;
    return () => {
      document.title = "Time Tracker";
    };
  }, [isRunning, formattedElapsed, description, selectedProjectId, projects]);

  // ─── Keyboard shortcut: Space → toggle timer ─────────────────────────────────
  // handleToggle is defined after the conditional return, so we forward calls
  // through a stable ref.  The ref is nulled while saving to match the
  // button's disabled={saving} guard.
  const handleToggleRef = useRef<(() => void) | null>(null);

  const spaceHandler = useCallback((e: KeyboardEvent) => {
    if (handleToggleRef.current) {
      e.preventDefault();
      handleToggleRef.current();
    }
  }, []);

  useKeyboardShortcuts({ " ": spaceHandler });

  // ─── Conditional return AFTER all hooks ─────────────────────────────────────
  if (!hasSupabaseEnv || !supabase) {
    return <SetupScreen />;
  }

  // ─── Handlers ────────────────────────────────────────────────────────────────

  const handleStart = () => {
    setError(null);
    timerStart();
  };

  const handleStop = async () => {
    const capturedStartedAt = startedAt;
    if (!capturedStartedAt) return;

    timerStop();
    setSaving(true);
    setError(null);

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - capturedStartedAt.getTime()) / 1000);
    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    const { data, error: err } = await supabase
      .from("time_entries")
      .insert({
        description: description || null,
        project_id: selectedProject?.id ?? null,
        started_at: capturedStartedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select(
        "id, description, project_id, started_at, ended_at, duration_seconds, " +
        "projects(name, color), entry_tags(tags(id, name, color))"
      )
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      const entryId = (data as unknown as Record<string, unknown>).id as string;

      // Write entry-specific tags
      if (selectedEntryTagIds.length > 0) {
        await supabase
          .from("entry_tags")
          .insert(selectedEntryTagIds.map((tag_id) => ({ entry_id: entryId, tag_id })));
      }

      const entryTags = tags.filter((t) => selectedEntryTagIds.includes(t.id));
      setEntries((prev) =>
        [
          {
            ...(data as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
            ...extractProjectFields((data as unknown as Record<string, unknown>).projects),
            entry_tags: entryTags,
          },
          ...prev,
        ].slice(0, MAX_RECENT_ENTRIES)
      );
      setSelectedEntryTagIds([]);
    }

    setSaving(false);
    timerReset();
  };

  const handleToggle = () => {
    if (isRunning) {
      void handleStop();
    } else {
      handleStart();
    }
  };

  // Keep the ref pointing to the latest handleToggle; null it while saving so
  // the Space shortcut respects the same guard as the button's disabled state.
  handleToggleRef.current = saving ? null : handleToggle;

  const handleCreateProject = async (e: FormEvent) => {
    e.preventDefault();
    const name = newProjectName.trim();
    if (!name) return;

    setCreatingProject(true);
    setError(null);

    const { data, error: err } = await supabase
      .from("projects")
      .insert({ name, color: newProjectColor })
      .select("id, name, color")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      const project: Project = { ...(data as Project), tags: [] };
      setProjects((prev) => [...prev, project]);
      setSelectedProjectId(project.id);
      setNewProjectName(project.name);
      setNewProjectColor(DEFAULT_PROJECT_COLOR);
    }

    setCreatingProject(false);
  };

  const handleManualSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!manualDate || !manualStartTime || !manualEndTime) {
      setError("Please choose a date, start time, and end time.");
      return;
    }

    const start = new Date(`${manualDate}T${manualStartTime}:00`);
    const end = new Date(`${manualDate}T${manualEndTime}:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Invalid date or time.");
      return;
    }

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    const durationSeconds = Math.floor((end.getTime() - start.getTime()) / 1000);
    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    setManualSaving(true);

    const { data, error: err } = await supabase
      .from("time_entries")
      .insert({
        description: manualDescription || null,
        project_id: selectedProject?.id ?? null,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select(
        "id, description, project_id, started_at, ended_at, duration_seconds, " +
        "projects(name, color), entry_tags(tags(id, name, color))"
      )
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      const entryId = (data as unknown as Record<string, unknown>).id as string;

      // Write entry-specific tags
      if (selectedEntryTagIds.length > 0) {
        await supabase
          .from("entry_tags")
          .insert(selectedEntryTagIds.map((tag_id) => ({ entry_id: entryId, tag_id })));
      }

      const entryTags = tags.filter((t) => selectedEntryTagIds.includes(t.id));
      setEntries((prev) =>
        [
          {
            ...(data as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
            ...extractProjectFields((data as unknown as Record<string, unknown>).projects),
            entry_tags: entryTags,
          },
          ...prev,
        ].slice(0, MAX_RECENT_ENTRIES)
      );
      setManualDescription("");
      setManualDate(formatLocalDate(new Date()));
      setManualStartTime("");
      setManualEndTime("");
      setManualDuration("");
      setSelectedEntryTagIds([]);
    }

    setManualSaving(false);
  };

  const handleEditEntry = (entry: TimeEntry) => setEditingEntry(entry);

  const handleSaveEditEntry = async (update: {
    id: string;
    description: string;
    project_id: string;
    started_at: string;
    ended_at: string;
    entry_tag_ids: string[];
  }) => {
    const { data, error: err } = await supabase
      .from("time_entries")
      .update({
        description: update.description,
        project_id: update.project_id,
        started_at: update.started_at,
        ended_at: update.ended_at,
      })
      .eq("id", update.id)
      .select(
        "id, description, project_id, started_at, ended_at, duration_seconds, " +
        "projects(name, color)"
      )
      .single();

    if (err) {
      setError(err.message);
      throw err; // Re-throw so EditEntryModal can reset its saving state
    } else if (data) {
      // Sync entry_tags: delete all then re-insert
      await supabase.from("entry_tags").delete().eq("entry_id", update.id);
      if (update.entry_tag_ids.length > 0) {
        await supabase
          .from("entry_tags")
          .insert(update.entry_tag_ids.map((tag_id) => ({ entry_id: update.id, tag_id })));
      }

      const entryTags = tags.filter((t) => update.entry_tag_ids.includes(t.id));
      setEntries((prev) =>
        prev.map((e) =>
          e.id === update.id
            ? {
              ...(data as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
              ...extractProjectFields((data as unknown as Record<string, unknown>).projects),
              entry_tags: entryTags,
            }
            : e
        )
      );
      setEditingEntry(null);
    }
  };

  // ─── Tag handlers ─────────────────────────────────────────────────────────

  const handleCreateTag = async (name: string, color: string) => {
    setError(null);
    const { data, error: err } = await supabase
      .from("tags")
      .insert({ name, color })
      .select("id, name, color")
      .single();
    if (err) {
      setError(err.message);
    } else if (data) {
      setTags((prev) => [...prev, data as unknown as Tag]);
    }
  };

  const handleDeleteTag = async (id: string) => {
    setError(null);
    const { error: err } = await supabase.from("tags").delete().eq("id", id);
    if (err) {
      setError(err.message);
    } else {
      setTags((prev) => prev.filter((t) => t.id !== id));
      // Remove from projects' local tag lists
      setProjects((prev) =>
        prev.map((p) => ({ ...p, tags: (p.tags ?? []).filter((t) => t.id !== id) }))
      );
      // Remove from entries' local tag lists
      setEntries((prev) =>
        prev.map((e) => ({ ...e, entry_tags: (e.entry_tags ?? []).filter((t) => t.id !== id) }))
      );
    }
  };

  /**
   * Replace all tags on a project with the provided tag ID list.
   * Deletes old project_tags rows then inserts new ones.
   */
  const handleUpdateProjectTags = async (projectId: string, tagIds: string[]) => {
    setError(null);
    await supabase.from("project_tags").delete().eq("project_id", projectId);
    if (tagIds.length > 0) {
      const { error: err } = await supabase
        .from("project_tags")
        .insert(tagIds.map((tag_id) => ({ project_id: projectId, tag_id })));
      if (err) {
        setError(err.message);
        return;
      }
    }
    const newTags = tags.filter((t) => tagIds.includes(t.id));
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, tags: newTags } : p))
    );
  };

  const handleDeleteEntry = async (id: string) => {
    setError(null);
    const { error: err } = await supabase.from("time_entries").delete().eq("id", id);
    if (err) {
      setError(err.message);
    } else {
      setEntries((prev) => prev.filter((e) => e.id !== id));
    }
  };

  const handleDeleteProject = async (id: string) => {
    setError(null);
    const { error: err } = await supabase.from("projects").delete().eq("id", id);
    if (err) {
      setError(err.message);
    } else {
      setProjects((prev) => prev.filter((p) => p.id !== id));
      if (selectedProjectId === id) setSelectedProjectId("");
    }
  };

  const handleUpdateProjectColor = async (id: string, color: string) => {
    setError(null);
    const { error: err } = await supabase.from("projects").update({ color }).eq("id", id);
    if (err) {
      setError(err.message);
    } else {
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, color } : p)));
      setEntries((prev) =>
        prev.map((e) => (e.project_id === id ? { ...e, project_color: color } : e))
      );
    }
  };

  const handleCopyToManual = (entry: TimeEntry) => {
    const started = entry.started_at ? new Date(entry.started_at) : null;
    const ended = entry.ended_at ? new Date(entry.ended_at) : null;

    if (started) {
      setManualDate(formatLocalDate(started));
      setManualStartTime(formatLocalTime(started));
    }
    setManualEndTime(ended ? formatLocalTime(ended) : "");
    setManualDescription(entry.description ?? "");
    setDescription(entry.description ?? "");

    if (typeof entry.duration_seconds === "number") {
      const h = Math.floor(entry.duration_seconds / 3600).toString().padStart(2, "0");
      const m = Math.floor((entry.duration_seconds % 3600) / 60).toString().padStart(2, "0");
      setManualDuration(`${h}:${m}`);
    } else {
      setManualDuration("");
    }

    if (entry.project_id) {
      setSelectedProjectId(entry.project_id);
      const project = projects.find((p) => p.id === entry.project_id);
      if (project) setNewProjectName(project.name);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Time Tracker</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Minimal, self-hosted tracking powered by Supabase.</p>
        </div>
        <button
          onClick={toggleTheme}
          className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          aria-label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
          title={theme === 'dark' ? 'Dark mode' : 'Light mode'}
        >
          {theme === 'dark' ? '🌙 Dark mode' : '☀ Light mode'}
        </button>
      </header>

      {loading ? (
        <div className="text-zinc-500 dark:text-zinc-400 text-sm py-8 text-center">Loading…</div>
      ) : (
        <>
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            newProjectName={newProjectName}
            setNewProjectName={setNewProjectName}
            newProjectColor={newProjectColor}
            setNewProjectColor={setNewProjectColor}
            creatingProject={creatingProject}
            handleCreateProject={handleCreateProject}
            onDeleteProject={handleDeleteProject}
            onUpdateProjectColor={handleUpdateProjectColor}
            tags={tags}
            onCreateTag={handleCreateTag}
            onDeleteTag={handleDeleteTag}
            onUpdateProjectTags={handleUpdateProjectTags}
          />

          <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 mt-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-4xl font-mono tabular-nums sm:text-5xl">{formattedElapsed}</div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {isRunning ? "Timer is running…" : "Timer is stopped."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                disabled={saving}
                className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium shadow-lg shadow-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 ${isRunning
                  ? "bg-rose-500 text-white hover:bg-rose-400"
                  : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  } ${saving ? "opacity-70" : ""}`}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
            </div>
            <div className="mt-6">
              <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="mt-4">
              <TagSelector
                allTags={tags}
                selectedTagIds={selectedEntryTagIds}
                onToggleTag={(id) =>
                  setSelectedEntryTagIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  )
                }
                onCreateTag={handleCreateTag}
                onDeleteTag={handleDeleteTag}
                compact
                label="Entry tags (optional)"
              />
            </div>
            {error && <p className="mt-4 text-xs text-rose-400">{error}</p>}
          </section>

          <ManualEntryForm
            manualDate={manualDate}
            setManualDate={setManualDate}
            manualStartTime={manualStartTime}
            setManualStartTime={setManualStartTime}
            manualEndTime={manualEndTime}
            setManualEndTime={setManualEndTime}
            manualDuration={manualDuration}
            setManualDuration={setManualDuration}
            manualDescription={manualDescription}
            setManualDescription={setManualDescription}
            manualSaving={manualSaving}
            handleManualSubmit={handleManualSubmit}
            hourOptions={hourOptions}
          />

          <RecentEntries
            entries={entries}
            projects={projects}
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
            onCopyToManual={handleCopyToManual}
          />

          {editingEntry && (
            <EditEntryModal
              entry={editingEntry}
              projects={projects}
              tags={tags}
              onCreateTag={handleCreateTag}
              onSave={handleSaveEditEntry}
              onClose={() => setEditingEntry(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

