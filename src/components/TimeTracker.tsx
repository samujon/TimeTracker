"use client";

import { useEffect, useMemo, useState } from "react";
import { hasSupabaseEnv, getSupabaseClient } from "@/lib/supabaseClient";
import { SetupScreen } from "./SetupScreen";

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

  const hourOptions = Array.from({ length: 24 }, (_, i) =>
    `${i.toString().padStart(2, "0")}:00`,
  );

  const [isRunning, setIsRunning] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [entries, setEntries] = useState<TimeEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [manualDate, setManualDate] = useState("");
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [manualSaving, setManualSaving] = useState(false);

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

  useEffect(() => {
    if (!isRunning || !startedAt) return;

    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt.getTime());
    }, 500);

    return () => window.clearInterval(id);
  }, [isRunning, startedAt]);

  const currentElapsed = useMemo(() => {
    if (!isRunning || !startedAt) return elapsedMs;
    return Date.now() - startedAt.getTime();
  }, [elapsedMs, isRunning, startedAt]);

  const formattedElapsed = useMemo(() => {
    const totalSeconds = Math.floor(currentElapsed / 1000);
    const hours = Math.floor(totalSeconds / 3600)
      .toString()
      .padStart(2, "0");
    const minutes = Math.floor((totalSeconds % 3600) / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  }, [currentElapsed]);

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
    const durationSeconds = Math.floor(
      (endedAt.getTime() - startedAt.getTime()) / 1000,
    );

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
            <h1 className="text-xl font-semibold tracking-tight">
              Time Tracker
            </h1>
            <p className="mt-1 text-xs text-zinc-400">
              Minimal, self-hosted tracking powered by Supabase.
            </p>
          </div>
          <span className="rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400">
            Dark mode · Local Supabase
          </span>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-medium text-zinc-200">
                Tasks
              </h2>
              <p className="mt-1 text-[11px] text-zinc-500">
                Reuse consistent task names across days.
              </p>
            </div>
          </div>
          <form
            onSubmit={handleCreateProject}
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium text-zinc-300">
                New task name
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="e.g. Programming, Language learning"
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              disabled={creatingProject || !newProjectName.trim()}
              className="mt-2 inline-flex items-center justify-center rounded-full bg-zinc-100 px-5 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-black/30 transition hover:bg-white disabled:opacity-60 sm:mt-6"
            >
              Add task
            </button>
          </form>
          {projects.length > 0 && (
            <div className="mt-4">
              <label className="block text-xs font-medium text-zinc-300">
                Selected task
              </label>
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">No task selected</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-4xl font-mono tabular-nums sm:text-5xl">
                {formattedElapsed}
              </div>
              <p className="mt-2 text-xs text-zinc-400">
                {isRunning ? "Timer is running…" : "Timer is stopped."}
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggle}
              disabled={saving}
              className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium shadow-lg shadow-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900 ${
                isRunning
                  ? "bg-rose-500 text-white hover:bg-rose-400"
                  : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              } ${saving ? "opacity-70" : ""}`}
            >
              {isRunning ? "Stop" : "Start"}
            </button>
          </div>

          <div className="mt-6">
            <label className="block text-xs font-medium text-zinc-300">
              Description (optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are you working on?"
              className="mt-2 w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {error && (
            <p className="mt-4 text-xs text-rose-400">
              {error}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6">
          <div className="mb-4 flex items-center justify-between gap-2">
            <h2 className="text-sm font-medium text-zinc-200">
              Add manual entry
            </h2>
            <span className="text-[11px] text-zinc-500">
              For past days or specific times
            </span>
          </div>
          <form
            onSubmit={handleManualSubmit}
            className="grid gap-4 sm:grid-cols-2"
          >
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Date
              </label>
              <input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Description (optional)
              </label>
              <input
                type="text"
                value={manualDescription}
                onChange={(e) => setManualDescription(e.target.value)}
                placeholder="What did you work on?"
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                Start time (24h)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="09:00"
                list="time-options"
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-xs font-medium text-zinc-300">
                End time (24h)
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="17:30"
                list="time-options"
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={manualSaving}
                className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-6 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-black/30 transition hover:bg-white disabled:opacity-60"
              >
                Save manual entry
              </button>
            </div>
          </form>
          <datalist id="time-options">
            {hourOptions.map((value) => (
              <option key={value} value={value} />
            ))}
          </datalist>
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-medium text-zinc-200">
              Recent entries
            </h2>
            <span className="text-[11px] uppercase tracking-wide text-zinc-500">
              Last 10
            </span>
          </div>
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60">
            {entries.length === 0 ? (
              <div className="px-4 py-6 text-xs text-zinc-500">
                No entries yet. Start the timer to create your first one.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800 text-xs">
                {entries.map((entry) => {
                  const started = new Date(entry.started_at);
                  const ended = entry.ended_at
                    ? new Date(entry.ended_at)
                    : null;
                  const duration =
                    entry.duration_seconds ?? (ended
                      ? Math.floor(
                          (ended.getTime() - started.getTime()) / 1000,
                        )
                      : null);
                  const hours =
                    duration !== null
                      ? Math.floor(duration / 3600)
                          .toString()
                          .padStart(2, "0")
                      : "--";
                  const minutes =
                    duration !== null
                      ? Math.floor((duration % 3600) / 60)
                          .toString()
                          .padStart(2, "0")
                      : "--";
                  const seconds =
                    duration !== null
                      ? (duration % 60).toString().padStart(2, "0")
                      : "--";

                  return (
                    <li
                      key={entry.id}
                      className="flex items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-zinc-100">
                          {entry.description || "Untitled session"}
                        </p>
                        <p className="mt-1 text-[11px] text-zinc-500">
                          {started.toLocaleString()}
                        </p>
                      </div>
                      <div className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-200">
                        {hours}:{minutes}:{seconds}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

