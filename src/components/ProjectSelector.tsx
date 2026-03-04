import React, { useState, useEffect } from "react";

type Project = {
  id: string;
  name: string;
  color?: string;
};

type ProjectSelectorProps = {
  projects: Project[];
  selectedProjectId: string;
  setSelectedProjectId: (id: string) => void;
  newProjectName: string;
  setNewProjectName: (name: string) => void;
  newProjectColor: string;
  setNewProjectColor: (color: string) => void;
  creatingProject: boolean;
  handleCreateProject: (e: React.FormEvent) => void;
  onDeleteProject: (id: string) => void;
};

export function ProjectSelector({
  projects,
  selectedProjectId,
  setSelectedProjectId,
  newProjectName,
  setNewProjectName,
  newProjectColor,
  setNewProjectColor,
  creatingProject,
  handleCreateProject,
  onDeleteProject,
}: ProjectSelectorProps) {
  const [tab, setTab] = useState<"add" | "select" | "delete">(projects.length > 0 ? "select" : "add");

  // Update tab if projects list changes (e.g., first project added or all deleted)
  useEffect(() => {
    if (projects.length === 0 && tab !== "add") {
      setTab("add");
    } else if (projects.length > 0 && tab === "add") {
      setTab("select");
    }
  }, [projects.length]);

  return (
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-200">Tasks</h2>
          <p className="mt-1 text-[11px] text-zinc-500">
            Reuse consistent task names across days.
          </p>
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "add" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          onClick={() => setTab("add")}
        >
          Add
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "select" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          onClick={() => setTab("select")}
        >
          Select
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "delete" ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          onClick={() => setTab("delete")}
        >
          Delete
        </button>
      </div>

      {tab === "add" && (
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
          <div>
            <label className="block text-xs font-medium text-zinc-300">Color</label>
            <input
              type="color"
              value={newProjectColor}
              onChange={(e) => setNewProjectColor(e.target.value)}
              className="mt-2 w-10 h-10 p-0 border-none bg-transparent cursor-pointer"
              title="Pick a color for this task"
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
      )}

      {tab === "select" && projects.length > 0 && (
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

      {tab === "delete" && projects.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-800">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-zinc-100">{project.name}</span>
              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                className="ml-2 rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500"
                title="Delete task"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
