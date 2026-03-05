
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { SetupScreen } from "./SetupScreen";
import { useTimer } from "./useTimer";
import { ProjectSelector } from "./ProjectSelector";
import { ManualEntryForm } from "./ManualEntryForm";
import { RecentEntries } from "./RecentEntries";
import { EditEntryModal } from "./EditEntryModal";
import type { TimeEntry, Project } from "@/types";
import { MAX_RECENT_ENTRIES, DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { buildHourOptions, formatLocalDate, formatLocalTime } from "@/lib/timeUtils";

/**
 * Normalises the `projects` join returned by Supabase — which can be either an
 * array or a single object depending on relationship cardinality — into flat
 * `project_name` / `project_color` strings.
 */
function extractProjectFields(projects: unknown): {
  project_name: string | null;
  project_color: string | null;
} {
  if (Array.isArray(projects)) {
    const p = projects[0] as { name?: string; color?: string } | undefined;
    return { project_name: p?.name ?? null, project_color: p?.color ?? null };
  }
  const p = projects as { name?: string; color?: string } | null;
  return { project_name: p?.name ?? null, project_color: p?.color ?? null };
}

export function TimeTracker() {
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

  useEffect(() => {
    if (!supabase) return;

    const loadEntries = async () => {
      const { data, error: err } = await supabase
        .from("time_entries")
        .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)")
        .order("started_at", { ascending: false })
        .limit(MAX_RECENT_ENTRIES);

      if (err) {
        setError(err.message);
      } else {
        setEntries(
          (data ?? []).map((entry: Record<string, unknown>) => ({
            ...(entry as Omit<TimeEntry, "project_name" | "project_color">),
            ...extractProjectFields(entry.projects),
          }))
        );
      }
    };

    void loadEntries();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    const loadProjects = async () => {
      const { data, error: err } = await supabase
        .from("projects")
        .select("id, name, color")
        .order("created_at", { ascending: true });

      if (err) {
        setError(err.message);
      } else {
        setProjects((data as Project[]) ?? []);
      }
      setLoading(false);
    };

    void loadProjects();
  }, [supabase]);

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
      .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setEntries((prev) =>
        [
          {
            ...(data as Omit<TimeEntry, "project_name" | "project_color">),
            ...extractProjectFields((data as Record<string, unknown>).projects),
          },
          ...prev,
        ].slice(0, MAX_RECENT_ENTRIES)
      );
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

  const handleCreateProject = async (e: React.FormEvent) => {
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
      const project = data as Project;
      setProjects((prev) => [...prev, project]);
      setSelectedProjectId(project.id);
      setNewProjectName("");
      setNewProjectColor(DEFAULT_PROJECT_COLOR);
    }

    setCreatingProject(false);
  };

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

    const { data, error: err } = await supabase
      .from("time_entries")
      .insert({
        description: manualDescription || null,
        project_id: selectedProject?.id ?? null,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setEntries((prev) =>
        [
          {
            ...(data as Omit<TimeEntry, "project_name" | "project_color">),
            ...extractProjectFields((data as Record<string, unknown>).projects),
          },
          ...prev,
        ].slice(0, MAX_RECENT_ENTRIES)
      );
      setManualDescription("");
      setManualDate(formatLocalDate(new Date()));
      setManualStartTime("");
      setManualEndTime("");
      setManualDuration("");
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
      .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)")
      .single();

    if (err) {
      setError(err.message);
      throw err; // Re-throw so EditEntryModal can reset its saving state
    } else if (data) {
      setEntries((prev) =>
        prev.map((e) =>
          e.id === update.id
            ? {
              ...(data as Omit<TimeEntry, "project_name" | "project_color">),
              ...extractProjectFields((data as Record<string, unknown>).projects),
            }
            : e
        )
      );
      setEditingEntry(null);
    }
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
          <p className="mt-1 text-xs text-zinc-400">Minimal, self-hosted tracking powered by Supabase.</p>
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
          Dark mode · Local Supabase
        </span>
      </header>

      {loading ? (
        <div className="text-zinc-500 text-sm py-8 text-center">Loading…</div>
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
          />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 mt-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-4xl font-mono tabular-nums sm:text-5xl">{formattedElapsed}</div>
                <p className="mt-2 text-xs text-zinc-400">
                  {isRunning ? "Timer is running…" : "Timer is stopped."}
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggle}
                disabled={saving}
                className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium shadow-lg shadow-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${isRunning
                    ? "bg-rose-500 text-white hover:bg-rose-400"
                    : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                  } ${saving ? "opacity-70" : ""}`}
              >
                {isRunning ? "Stop" : "Start"}
              </button>
            </div>
            <div className="mt-6">
              <label className="block text-xs font-medium text-zinc-300">Description (optional)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What are you working on?"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
            onDeleteEntry={handleDeleteEntry}
            onEditEntry={handleEditEntry}
            onCopyToManual={handleCopyToManual}
          />

          {editingEntry && (
            <EditEntryModal
              entry={editingEntry}
              projects={projects}
              onSave={handleSaveEditEntry}
              onClose={() => setEditingEntry(null)}
            />
          )}
        </>
      )}
    </div>
  );
}

