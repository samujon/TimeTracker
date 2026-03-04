"use client";

import { useEffect, useState } from "react";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { SetupScreen } from "./SetupScreen";
import { useTimer } from "./useTimer";
import { ProjectSelector } from "./ProjectSelector";
import { ManualEntryForm } from "./ManualEntryForm";
import { RecentEntries } from "./RecentEntries";

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
};

export function TimeTracker() {
  const supabase = getSupabaseClient();
  const hourOptions = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

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
  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

  // Project/task state
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [creatingProject, setCreatingProject] = useState(false);

  useEffect(() => {
    if (!supabase) return;

    const loadEntries = async () => {
      const { data, error: err } = await supabase
        .from("time_entries")
        .select("id, description, project_id, started_at, ended_at, duration_seconds")
        .order("started_at", { ascending: false })
        .limit(10);

      if (err) {
        setError(err.message);
        return;
      }
      setEntries(data ?? []);
    };

    void loadEntries();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;

    const loadProjects = async () => {
      const { data, error: err } = await supabase
        .from("projects")
        .select("id, name")
        .order("created_at", { ascending: true });

      if (err) {
        setError(err.message);
        return;
      }
      setProjects(data ?? []);
    };

    void loadProjects();
  }, [supabase]);

  if (!hasSupabaseEnv || !supabase) {
    return <SetupScreen />;
  }

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

    const { data, error: err } = await supabase
      .from("time_entries")
      .insert({
        description: description || null,
        started_at: startedAt.toISOString(),
        ended_at: endedAt.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select("id, description, started_at, ended_at, duration_seconds")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setEntries((prev) => [data as TimeEntry, ...prev].slice(0, 10));
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
      .insert({ name })
      .select("id, name")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setProjects((prev) => [...prev, data as Project]);
      setSelectedProjectId((data as Project).id);
      setNewProjectName("");
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

    const effectiveDescription =
      manualDescription || selectedProject?.name || null;

    const { data, error: err } = await supabase
      .from("time_entries")
      .insert({
        description: effectiveDescription,
        project_id: selectedProject ? selectedProject.id : null,
        started_at: start.toISOString(),
        ended_at: end.toISOString(),
        duration_seconds: durationSeconds,
      })
      .select("id, description, started_at, ended_at, duration_seconds")
      .single();

    if (err) {
      setError(err.message);
    } else if (data) {
      setEntries((prev) => [data as TimeEntry, ...prev].slice(0, 10));
      setManualDescription("");
      setManualDate("");
      setManualStartTime("");
      setManualEndTime("");
    }

    setManualSaving(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-3xl space-y-8 rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-xl shadow-black/40">
        <header className="flex items-center justify-between gap-4">
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

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
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
        />
      </div>
    </div>
  );
}

