
"use client";

import React, { useEffect, useState } from "react";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { SetupScreen } from "./SetupScreen";
import { useTimer } from "./useTimer";
import { ProjectSelector } from "./ProjectSelector";
import { ManualEntryForm } from "./ManualEntryForm";
import { RecentEntries } from "./RecentEntries";

import { EditEntryModal } from "./EditEntryModal";

type TimeEntry = {
  id: string;
  description: string | null;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

type Project = {
  id: string;
  name: string;
  color?: string;
};

export function TimeTracker() {
  const [editingEntry, setEditingEntry] = useState<TimeEntry | null>(null);
  // Edit entry handler
  const handleEditEntry = (entry: TimeEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEditEntry = async (update: { id: string; description: string; project_id: string; started_at: string; ended_at: string }) => {
    if (!supabase) return;
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
    } else if (data) {
      setEntries((prev) => prev.map((e) =>
        e.id === update.id
          ? {
              ...data,
              project_name: Array.isArray(data.projects) ? (data.projects as any[])[0]?.name || null : (data.projects as any)?.name || null,
              project_color: Array.isArray(data.projects) ? (data.projects as any[])[0]?.color || null : (data.projects as any)?.color || null,
            }
          : e
      ));
      setEditingEntry(null);
    }
  };
  const supabase = getSupabaseClient();
  if (!hasSupabaseEnv || !supabase) {
    return <SetupScreen />;
  }
  const hourOptions = React.useMemo(() => {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += 15) {
        options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
      }
    }
    return options;
  }, []);

  // Timer logic
  const {
    isRunning,
    setIsRunning,
    startedAt,
    setStartedAt,
    elapsedMs,
    setElapsedMs,
    formattedElapsed,
  } = useTimer();

  // UI and data state
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Manual entry state
  const [manualDate, setManualDate] = useState(() => {
    const today = new Date();
    return today.toISOString().slice(0, 10);
  });
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualDuration, setManualDuration] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  // Project/task state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectColor, setNewProjectColor] = useState("#34d399");
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const loadEntries = async () => {
      const { data, error: err } = await supabase
        .from("time_entries")
        .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)")
        .order("started_at", { ascending: false })
        .limit(10);

      if (err) {
        setError(err.message);
        return;
      }
      // Map project name into project_name for RecentEntries
      setEntries(
        (data ?? []).map((entry: any) => ({
          ...entry,
          project_name: entry.projects?.name || null,
          project_color: entry.projects?.color || null,
        }))
      );
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
        return;
      }
      setProjects(data ?? []);
    };

    void loadProjects();
  }, [supabase]);



  const handleStart = () => {
    setError(null);
    setStartedAt(new Date());
    setElapsedMs(0);
    setIsRunning(true);
  };

  const handleStop = async () => {
    if (!startedAt) return;
    setIsRunning(false);
    setSaving(true);
    setError(null);

    const endedAt = new Date();
    const durationSeconds = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    const selectedProject = projects.find((project) => project.id === selectedProjectId);
    const { data, error: err } = await supabase
      .from("time_entries")
      .insert({
        description: description || null,
        project_id: selectedProject ? selectedProject.id : null,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setEntries((prev) => [
        {
          ...data,
          project_name: Array.isArray(data.projects) ? (data.projects as any[])[0]?.name || null : (data.projects as any)?.name || null,
          project_color: Array.isArray(data.projects) ? (data.projects as any[])[0]?.color || null : (data.projects as any)?.color || null,
        },
        ...prev,
      ].slice(0, 10));
    }

    setSaving(false);
    setStartedAt(null);
    setElapsedMs(0);
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
      setProjects((prev) => [...prev, data as Project]);
      setSelectedProjectId((data as Project).id);
      setNewProjectName("");
      setNewProjectColor("#34d399");
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

    const start = new Date(`${manualDate}T${manualStartTime}`);
    const end = new Date(`${manualDate}T${manualEndTime}`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setError("Invalid date or time.");
      return;
    }

    if (end <= start) {
      setError("End time must be after start time.");
      return;
    }

    const durationSeconds = Math.floor(
      (end.getTime() - start.getTime()) / 1000,
    );

    setManualSaving(true);

    const selectedProject = projects.find(
      (project) => project.id === selectedProjectId,
    );

    const effectiveDescription = manualDescription || null;

    const { data, error: err } = await supabase
      .from("time_entries")
      .insert({
        description: effectiveDescription,
        project_id: selectedProject ? selectedProject.id : null,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name, color)")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setEntries((prev) => [
        {
          ...data,
          project_name: Array.isArray(data.projects) ? (data.projects as any[])[0]?.name || null : (data.projects as any)?.name || null,
          project_color: Array.isArray(data.projects) ? (data.projects as any[])[0]?.color || null : (data.projects as any)?.color || null,
        },
        ...prev,
      ].slice(0, 10));
      setManualDescription("");
      setManualDate("");
      setManualStartTime("");
      setManualEndTime("");
    }

    setManualSaving(false);
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Time Tracker</h1>
          <p className="mt-1 text-xs text-zinc-400">Minimal, self-hosted tracking powered by Supabase.</p>
        </div>
        <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">Dark mode · Local Supabase</span>
      </header>

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
        onDeleteProject={async (id: string) => {
          setError(null);
          const { error: err } = await supabase.from("projects").delete().eq("id", id);
          if (err) {
            setError(err.message);
          } else {
            setProjects((prev) => prev.filter((p) => p.id !== id));
            if (selectedProjectId === id) setSelectedProjectId("");
          }
        }}
      />

      <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 mt-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-4xl font-mono tabular-nums sm:text-5xl">{formattedElapsed}</div>
            <p className="mt-2 text-xs text-zinc-400">{isRunning ? "Timer is running…" : "Timer is stopped."}</p>
          </div>
          <button
            type="button"
            onClick={handleToggle}
            disabled={saving}
            className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium shadow-lg shadow-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${isRunning ? "bg-rose-500 text-white hover:bg-rose-400" : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"} ${saving ? "opacity-70" : ""}`}
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
        onDeleteEntry={async (id: string) => {
          setError(null);
          const { error: err } = await supabase.from("time_entries").delete().eq("id", id);
          if (err) {
            setError(err.message);
          } else {
            setEntries((prev) => prev.filter((e) => e.id !== id));
          }
        }}
        onEditEntry={handleEditEntry}
        onCopyToManual={(entry) => {
          // Set manual entry fields from the selected entry
          // Parse date and times from started_at and ended_at
          const started = entry.started_at ? new Date(entry.started_at) : null;
          const ended = entry.ended_at ? new Date(entry.ended_at) : null;
          if (started) {
            setManualDate(started.toISOString().slice(0, 10));
            setManualStartTime(started.toTimeString().slice(0, 5));
          }
          if (ended) {
            setManualEndTime(ended.toTimeString().slice(0, 5));
          } else {
            setManualEndTime("");
          }
          setManualDescription(entry.description || "");
          // Set duration if available
          if (typeof entry.duration_seconds === "number") {
            const hours = Math.floor(entry.duration_seconds / 3600).toString().padStart(2, "0");
            const minutes = Math.floor((entry.duration_seconds % 3600) / 60).toString().padStart(2, "0");
            setManualDuration(`${hours}:${minutes}`);
          } else {
            setManualDuration("");
          }
          if (entry.project_id) {
            setSelectedProjectId(entry.project_id);
            // Also set the project name in the input field for ProjectSelector
            const project = projects.find((p) => p.id === entry.project_id);
            if (project) {
              setNewProjectName(project.name);
            }
          }
        }}
      />

      {editingEntry && (
        <EditEntryModal
          entry={editingEntry}
          projects={projects}
          onSave={handleSaveEditEntry}
          onClose={() => setEditingEntry(null)}
        />
      )}
    </div>
  );
}

