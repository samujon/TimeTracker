"use client";

import React, { useState, useRef, useEffect } from "react";

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
  const [tab, setTab] = useState<"main" | "delete">("main");
  // Popover state for color picker
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const colorPopoverRef = useRef<HTMLDivElement | null>(null);

  // Close popover on outside click
  useEffect(() => {
    if (!showColorPopover) return;
    function handleClick(e: MouseEvent) {
      if (
        colorPopoverRef.current &&
        !colorPopoverRef.current.contains(e.target as Node)
      ) {
        setShowColorPopover(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showColorPopover]);


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
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "main" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          onClick={() => setTab("main")}
        >
          Select/Add
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "delete" ? "bg-rose-600 text-white" : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"}`}
          onClick={() => setTab("delete")}
        >
          Delete
        </button>
      </div>


      {tab === "main" && (
        <form onSubmit={handleCreateProject} className="flex flex-col gap-2">
          <label className="block text-xs font-medium text-zinc-300 mb-1">Task</label>
          <div className="flex items-center gap-2 relative">
            <div className="flex-1 min-w-0">
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => {
                  setNewProjectName(e.target.value);
                  const found = projects.find(p => p.name === e.target.value);
                  if (found) {
                    setSelectedProjectId(found.id);
                  } else {
                    setSelectedProjectId("");
                  }
                }}
                onFocus={() => setDropdownOpen(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setDropdownOpen(false);
                  }, 100);
                }}
                onDoubleClick={() => setDropdownOpen(true)}
                className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Type or pick a task"
                disabled={creatingProject}
                autoComplete="off"
              />
              {/* Custom dropdown only visible when input is focused or typing */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 z-10 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {projects.length === 0 && (
                    <div className="px-3 py-2 text-sm text-zinc-400">No tasks</div>
                  )}
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-800 ${project.name === newProjectName ? "bg-zinc-800" : ""}`}
                      onMouseDown={() => {
                        setNewProjectName(project.name);
                        setSelectedProjectId(project.id);
                      }}
                    >
                      <span
                        className="inline-block w-4 h-4 rounded-full border-2 border-zinc-700"
                        style={{ backgroundColor: project.color || '#34d399' }}
                      />
                      <span className="text-sm text-zinc-100">{project.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Color picker button for new task (if not selecting existing) */}
            {!projects.find(p => p.name === newProjectName) && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-900 flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: newProjectColor }}
                  aria-label="Choose color"
                  tabIndex={0}
                  onMouseDown={e => {
                    e.preventDefault();
                    setShowColorPopover((v) => !v);
                  }}
                >
                  <span className="sr-only">Choose color</span>
                </button>
                {showColorPopover && (
                  <div
                    ref={colorPopoverRef}
                    className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-xl border border-zinc-700 bg-zinc-900 shadow-lg flex flex-col items-center"
                    style={{ minWidth: 180 }}
                    tabIndex={-1}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <div className="flex flex-wrap gap-1 mb-2 justify-center">
                      {[
                        "#ef4444", // red
                        "#f59e42", // orange
                        "#fbbf24", // yellow
                        "#22d3ee", // cyan
                        "#34d399", // green
                        "#6366f1", // indigo
                        "#a78bfa", // purple
                        "#f472b6", // pink
                        "#64748b", // slate
                        "#f1f5f9", // light
                        "#18181b", // dark
                      ].map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${newProjectColor === color ? "border-emerald-400 scale-110 ring-2 ring-emerald-300" : "border-zinc-700"}`}
                          style={{ backgroundColor: color }}
                          onClick={() => { setNewProjectColor(color); setShowColorPopover(false); }}
                          aria-label={`Choose color ${color}`}
                        />
                      ))}
                    </div>
                    <input
                      type="color"
                      value={newProjectColor}
                      onChange={(e) => { setNewProjectColor(e.target.value); }}
                      className="w-8 h-8 rounded-full border-2 border-zinc-700 bg-zinc-900 cursor-pointer"
                      title="Pick a custom color for this task"
                      style={{ minWidth: 32 }}
                    />
                  </div>
                )}
              </div>
            )}
            {/* Show add button only if new task name is not empty and not already in list */}
            {!projects.find(p => p.name === newProjectName) && newProjectName.trim() && (
              <button
                type="submit"
                disabled={creatingProject}
                className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-5 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-black/30 transition hover:bg-white disabled:opacity-60 ml-2"
              >
                Add
              </button>
            )}
            {/* Show color dot if selecting existing task */}
            {projects.find(p => p.name === newProjectName) && (
              <span
                className="inline-block w-5 h-5 rounded-full border-2 border-zinc-700 ml-2"
                style={{ backgroundColor: (projects.find(p => p.name === newProjectName)?.color || '#34d399') }}
                title="Task color"
              />
            )}
          </div>
          {/* Removed duplicate color picker below input */}
          {/* Removed duplicate Add button below input row */}
        </form>
      )}

      {tab === "delete" && projects.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-800">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-5 h-5 rounded-full border-2 border-zinc-700"
                  style={{ backgroundColor: project.color || '#34d399' }}
                  title="Task color"
                />
                <span className="text-sm text-zinc-100">{project.name}</span>
              </div>
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
