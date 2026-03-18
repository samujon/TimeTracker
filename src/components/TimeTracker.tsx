
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { useTimeTrackerData } from "@/hooks/useTimeTrackerData";
import { SetupScreen } from "@/views/SetupScreen";
import { useTimer } from "@/hooks/useTimer";
import { ProjectSelector } from "@/components/tracker/ProjectSelector";
import { TimerSection } from "@/components/tracker/TimerSection";
import { ManualEntryForm } from "@/components/tracker/ManualEntryForm";
import { RecentEntries } from "@/components/tracker/RecentEntries";
import { EditEntryModal } from "@/components/shared/EditEntryModal";
import type { TimeEntry } from "@/types";
import { buildHourOptions, formatLocalDate, formatLocalTime, extractProjectFields } from "@/lib/timeUtils";
import type { Theme } from "@/hooks/useTheme";

export function TimeTracker({ theme, toggleTheme }: { theme: Theme; toggleTheme: () => void }) {
  const { isRunning, startedAt, formattedElapsed, start: timerStart, stop: timerStop, reset: timerReset } = useTimer();

  const hourOptions = useMemo(() => buildHourOptions(), []);

  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const [manualDate, setManualDate] = useState(() => formatLocalDate(new Date()));
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  const [selectedEntryTagIds, setSelectedEntryTagIds] = useState<string[]>([]);

  const {
    loading,
    error,
    setError,
    entries,
    setEntries,
    projects,
    tags,
    selectedProjectId,
    setSelectedProjectId,
    newProjectName,
    setNewProjectName,
    newProjectColor,
    setNewProjectColor,
    creatingProject,
    insertEntryTags,
    handleDeleteEntry,
    handleCreateProject,
    handleCreateTag,
    handleDeleteTag,
    handleUpdateTagColor,
    handleUpdateProjectTags,
    handleDeleteProject,
    handleUpdateProjectColor,
    handleSaveEditEntry,
  } = useTimeTrackerData();

  // ─── Browser tab title ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isRunning) {
      document.title = "Time Tracker";
      return () => { document.title = "Time Tracker"; };
    }
    const projectName = projects.find((p) => p.id === selectedProjectId)?.name ?? null;
    const parts = [projectName, description || null].filter(Boolean).join(" · ");
    document.title = `⏱ ${formattedElapsed}${parts ? ` — ${parts}` : " — Time Tracker"}`;
    return () => { document.title = "Time Tracker"; };
  }, [isRunning, formattedElapsed, description, selectedProjectId, projects]);

  // ─── Keyboard shortcut ────────────────────────────────────────────────────────
  const handleToggleRef = useRef<(() => void) | null>(null);
  const spaceHandler = useCallback((e: KeyboardEvent) => {
    if (handleToggleRef.current) {
      e.preventDefault();
      handleToggleRef.current();
    }
  }, []);
  useKeyboardShortcuts({ " ": spaceHandler });

  if (!hasSupabaseEnv) {
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

    const supabase = getSupabaseClient()!;

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
      const entryTags = await insertEntryTags(entryId, selectedEntryTagIds);
      setEntries((prev) =>
        [
          {
            ...(data as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
            ...extractProjectFields((data as unknown as Record<string, unknown>).projects),
            entry_tags: entryTags,
          },
          ...prev,
        ].slice(0, 50)
      );
      setSelectedEntryTagIds([]);
    }

    setSaving(false);
    timerReset();
  };

  const handleToggle = () => {
    if (isRunning) void handleStop();
    else handleStart();
  };
  handleToggleRef.current = saving ? null : handleToggle;

  const handleManualSubmit = async (e: React.FormEvent) => {
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

    const supabase = getSupabaseClient()!;

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
      const entryTags = await insertEntryTags(entryId, selectedEntryTagIds);
      setEntries((prev) =>
        [
          {
            ...(data as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
            ...extractProjectFields((data as unknown as Record<string, unknown>).projects),
            entry_tags: entryTags,
          },
          ...prev,
        ].slice(0, 50)
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
            onUpdateTagColor={handleUpdateTagColor}
          />

          <TimerSection
            isRunning={isRunning}
            saving={saving}
            formattedElapsed={formattedElapsed}
            description={description}
            setDescription={setDescription}
            tags={tags}
            selectedEntryTagIds={selectedEntryTagIds}
            setSelectedEntryTagIds={setSelectedEntryTagIds}
            onToggle={handleToggle}
            onCreateTag={handleCreateTag}
            onDeleteTag={handleDeleteTag}
            error={error}
          />

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
            onEditEntry={setEditingEntry}
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


