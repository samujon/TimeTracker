"use client";

import React, { useState, useRef } from "react";
import type { Project } from "@/types";
import { PROJECT_COLORS, DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { useClickOutside } from "@/hooks/useClickOutside";

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
  onUpdateProjectColor: (id: string, color: string) => Promise<void>;
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
  onUpdateProjectColor,
}: ProjectSelectorProps) {
  const [tab, setTab] = useState<"main" | "delete">("main");
  const [showColorPopover, setShowColorPopover] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editColorProjectId, setEditColorProjectId] = useState<string | null>(null);
  const colorPopoverRef = useRef<HTMLDivElement | null>(null);
  const editColorPopoverRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLDivElement | null>(null);

  // Close colour popover on outside click
  useClickOutside(colorPopoverRef, () => setShowColorPopover(false), showColorPopover);
  // Close edit-colour popover on outside click
  useClickOutside(editColorPopoverRef, () => setEditColorProjectId(null), editColorProjectId !== null);
  // Close project dropdown on outside click
  useClickOutside(inputRef, () => setDropdownOpen(false), dropdownOpen);


  return (
    <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Projects</h2>
          <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
            Reuse consistent project names across days.
          </p>
        </div>
      </div>
      <div className="mb-4 flex gap-2">
        <button
          type="button"
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "main" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          onClick={() => setTab("main")}
        >
          Select/Add
        </button>
        <button
          type="button"
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "delete" ? "bg-rose-600 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          onClick={() => setTab("delete")}
        >
          Delete
        </button>
      </div>


      {tab === "main" && (
        <form onSubmit={handleCreateProject} className="flex flex-col gap-2">
          <label className="block text-xs font-medium text-zinc-300 mb-1">Project</label>
          <div className="flex items-center gap-2 relative">
            <div className="flex-1 min-w-0" ref={inputRef}>
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
                onDoubleClick={() => setDropdownOpen(true)}
                className="w-full max-w-md rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Type or pick a project"
                disabled={creatingProject}
                autoComplete="off"
              />
              {/* Custom dropdown only visible when input is focused or typing */}
              {dropdownOpen && (
                <div className="absolute left-0 right-0 mt-1 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                  {projects.length === 0 && (
                    <div className="px-3 py-2 text-sm text-zinc-500 dark:text-zinc-400">No projects</div>
                  )}
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 ${project.name === newProjectName ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                      onMouseDown={() => {
                        setNewProjectName(project.name);
                        setSelectedProjectId(project.id);
                      }}
                    >
                      <span
                        className="inline-block w-4 h-4 rounded-full border-2 border-zinc-700"
                        style={{ backgroundColor: project.color || '#34d399' }}
                      />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">{project.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Color picker button for new project (if not selecting existing) */}
            {!projects.find(p => p.name === newProjectName) && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center cursor-pointer"
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
                    className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg flex flex-col items-center"
                    style={{ minWidth: 180 }}
                    tabIndex={-1}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <div className="flex flex-wrap gap-1 mb-2 justify-center">
                      {PROJECT_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${newProjectColor === color ? "border-emerald-400 scale-110 ring-2 ring-emerald-300" : "border-zinc-300 dark:border-zinc-700"}`}
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
                      className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
                      title="Pick a custom color for this project"
                      style={{ minWidth: 32 }}
                    />
                  </div>
                )}
              </div>
            )}
            {!projects.find(p => p.name === newProjectName) && newProjectName.trim() && (
              <button
                type="submit"
                disabled={creatingProject}
                className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-5 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-black/30 transition hover:bg-white disabled:opacity-60 ml-2"
              >
                Add
              </button>
            )}
            {/* Show color dot if selecting existing project — clickable to edit color */}
            {projects.find(p => p.name === newProjectName) && (() => {
              const proj = projects.find(p => p.name === newProjectName)!;
              return (
                <div className="relative flex-shrink-0" ref={editColorPopoverRef}>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center ml-2 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition"
                    style={{ backgroundColor: proj.color || DEFAULT_PROJECT_COLOR }}
                    title="Edit project color"
                    aria-label="Edit project color"
                    onMouseDown={e => {
                      e.preventDefault();
                      setEditColorProjectId(editColorProjectId === proj.id ? null : proj.id);
                    }}
                  />
                  {editColorProjectId === proj.id && (
                    <div
                      className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg flex flex-col items-center"
                      style={{ minWidth: 180 }}
                      onMouseDown={e => e.preventDefault()}
                    >
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">Edit project color</p>
                      <div className="flex flex-wrap gap-1 mb-2 justify-center">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${(proj.color || DEFAULT_PROJECT_COLOR) === color ? "border-emerald-400 scale-110 ring-2 ring-emerald-300" : "border-zinc-300 dark:border-zinc-700"}`}
                            style={{ backgroundColor: color }}
                            onClick={() => { onUpdateProjectColor(proj.id, color); setEditColorProjectId(null); }}
                            aria-label={`Set color ${color}`}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        defaultValue={proj.color || DEFAULT_PROJECT_COLOR}
                        onChange={(e) => onUpdateProjectColor(proj.id, e.target.value)}
                        className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
                        title="Pick a custom color"
                        style={{ minWidth: 32 }}
                      />
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
          {/* Removed duplicate color picker below input */}
          {/* Removed duplicate Add button below input row */}
        </form>
      )}

      {tab === "delete" && projects.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <div className="relative" ref={editColorProjectId === project.id ? editColorPopoverRef : null}>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center cursor-pointer hover:ring-2 hover:ring-emerald-400 transition"
                    style={{ backgroundColor: project.color || '#34d399' }}
                    title="Edit project color"
                    aria-label="Edit project color"
                    onClick={() => {
                      setEditColorProjectId(editColorProjectId === project.id ? null : project.id);
                    }}
                  />
                  {editColorProjectId === project.id && (
                    <div
                      className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg flex flex-col items-center"
                      style={{ minWidth: 180 }}
                    >
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">Edit project color</p>
                      <div className="flex flex-wrap gap-1 mb-2 justify-center">
                        {PROJECT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-6 h-6 rounded-full border-2 transition-transform ${(project.color || DEFAULT_PROJECT_COLOR) === color ? "border-emerald-400 scale-110 ring-2 ring-emerald-300" : "border-zinc-300 dark:border-zinc-700"}`}
                            style={{ backgroundColor: color }}
                            onClick={() => { onUpdateProjectColor(project.id, color); setEditColorProjectId(null); }}
                            aria-label={`Set color ${color}`}
                          />
                        ))}
                      </div>
                      <input
                        type="color"
                        defaultValue={project.color || DEFAULT_PROJECT_COLOR}
                        onChange={(e) => onUpdateProjectColor(project.id, e.target.value)}
                        className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer"
                        title="Pick a custom color"
                        style={{ minWidth: 32 }}
                      />
                    </div>
                  )}
                </div>
                <span className="text-sm text-zinc-900 dark:text-zinc-100">{project.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                className="ml-2 rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500"
                title="Delete project"
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
