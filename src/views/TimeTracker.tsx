
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { hasSupabaseEnv } from "@/lib/supabaseClient";
import { useTimeTrackerData } from "@/hooks/useTimeTrackerData";
import { SetupScreen } from "./SetupScreen";
import { useTimer } from "@/hooks/useTimer";
import { ProjectSelector } from "@/components/tracker/ProjectSelector";
import { TimerSection } from "@/components/tracker/TimerSection";
import { ManualEntryForm } from "@/components/tracker/ManualEntryForm";
import { RecentEntries } from "@/components/tracker/RecentEntries";
import { EditEntryModal } from "@/components/shared/EditEntryModal";
import type { TimeEntry } from "@/types";
import { buildHourOptions, formatLocalDate, formatLocalTime } from "@/lib/timeUtils";

export function TimeTracker() {
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

  const [timerTagIds, setTimerTagIds] = useState<string[]>([]);

  const {
    loading,
    error,
    setError,
    entries,
    projects,
    tags,
    selectedProjectId,
    setSelectedProjectId,
    newProjectName,
    setNewProjectName,
    newProjectColor,
    setNewProjectColor,
    creatingProject,
    handleCreateEntry,
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

    const success = await handleCreateEntry({
      description: description || null,
      projectId: selectedProjectId || null,
      startedAt: capturedStartedAt,
      endedAt: new Date(),
      tagIds: timerTagIds,
    });

    if (success) {
      setTimerTagIds([]);
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
    setManualSaving(true);

    const success = await handleCreateEntry({
      description: manualDescription || null,
      projectId: selectedProjectId || null,
      startedAt: start,
      endedAt: end,
      tagIds: [],
    });

    if (success) {
      setManualDescription("");
      setManualDate(formatLocalDate(new Date()));
      setManualStartTime("");
      setManualEndTime("");
      setManualDuration("");
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
    <div className="space-y-6">
      {loading ? (
        <div className="text-[var(--color-text-muted)] text-sm py-8 text-center">Loading…</div>
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
            selectedEntryTagIds={timerTagIds}
            setSelectedEntryTagIds={setTimerTagIds}
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


