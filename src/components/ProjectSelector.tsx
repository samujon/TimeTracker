"use client";

import React, { useState } from "react";
import type { Project, Tag } from "@/types";
import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { useDisclosure } from "@/hooks/useDisclosure";
import { TagSelector } from "./TagSelector";
import { ColorPicker } from "./ColorPicker";

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
  // Tags
  tags: Tag[];
  onCreateTag: (name: string, color: string) => Promise<void>;
  onDeleteTag: (id: string) => void;
  onUpdateProjectTags: (projectId: string, tagIds: string[]) => Promise<void>;
  onUpdateTagColor: (id: string, color: string) => Promise<void>;
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
  tags,
  onCreateTag,
  onDeleteTag,
  onUpdateProjectTags,
  onUpdateTagColor,
}: ProjectSelectorProps) {
  const [tab, setTab] = useState<"main" | "delete" | "tags">("main");

  // useDisclosure handles open state + click-outside for each popover/dropdown.
  const newColorDisclosure = useDisclosure<HTMLDivElement>();
  const editColorDisclosure = useDisclosure<HTMLDivElement>();
  const dropdownDisclosure = useDisclosure<HTMLDivElement>();

  // Hoist the selected-project lookup so it's computed once per render.
  const existingProject = projects.find((p) => p.name === newProjectName) ?? null;


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
          className={`rounded-full px-4 py-1 text-xs font-medium transition ${tab === "tags" ? "bg-violet-500 text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700"}`}
          onClick={() => setTab("tags")}
        >
          Tags
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
          <div className="relative flex items-center gap-2" ref={dropdownDisclosure.ref}>
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
                onFocus={() => dropdownDisclosure.set(true)}
                onDoubleClick={() => dropdownDisclosure.set(true)}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="Type or pick a project"
                disabled={creatingProject}
                autoComplete="off"
              />
              {/* Custom dropdown only visible when input is focused or typing */}
              {dropdownDisclosure.open && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-48 overflow-y-auto">
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
                        dropdownDisclosure.close();
                      }}
                    >
                      <span
                        className="inline-block w-4 h-4 rounded-full border-2 border-zinc-700"
                        style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
                      />
                      <span className="text-sm text-zinc-900 dark:text-zinc-100">{project.name}</span>
                    </div>
                  ))}
                </div>
              )}
            {/* Color picker button for new project — only shown when about to create */}
            {!existingProject && newProjectName.trim() && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center cursor-pointer"
                  style={{ backgroundColor: newProjectColor }}
                  aria-label="Choose color"
                  tabIndex={0}
                  onMouseDown={e => {
                    e.preventDefault();
                    newColorDisclosure.toggle();
                  }}
                >
                  <span className="sr-only">Choose color</span>
                </button>
                {newColorDisclosure.open && (
                  <div
                    ref={newColorDisclosure.ref}
                    className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg flex flex-col items-center"
                    style={{ minWidth: 180 }}
                    tabIndex={-1}
                    onMouseDown={e => e.preventDefault()}
                  >
                    <ColorPicker value={newProjectColor} onChange={setNewProjectColor} />
                  </div>
                )}
              </div>
            )}
            {!existingProject && newProjectName.trim() && (
              <button
                type="submit"
                disabled={creatingProject}
                className="inline-flex items-center justify-center rounded-full bg-zinc-100 px-5 py-2 text-xs font-medium text-zinc-950 shadow-md shadow-black/30 transition hover:bg-white disabled:opacity-60 ml-2"
              >
                Add
              </button>
            )}
            {/* Show color dot if selecting existing project — clickable to edit color */}
            {existingProject && (() => {
              const proj = existingProject;
              return (
                <div className="relative flex-shrink-0" ref={editColorDisclosure.ref}>
                  <button
                    type="button"
                    className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center ml-2 cursor-pointer hover:ring-2 hover:ring-emerald-400 transition"
                    style={{ backgroundColor: proj.color ?? DEFAULT_PROJECT_COLOR }}
                    title="Edit project color"
                    aria-label="Edit project color"
                    onMouseDown={e => {
                      e.preventDefault();
                      editColorDisclosure.toggle();
                    }}
                  />
                  {editColorDisclosure.open && (
                    <div
                      className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg flex flex-col items-center"
                      style={{ minWidth: 180 }}
                      onMouseDown={e => e.preventDefault()}
                    >
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">Edit project color</p>
                      <ColorPicker
                        value={proj.color ?? DEFAULT_PROJECT_COLOR}
                        onChange={(c) => void onUpdateProjectColor(proj.id, c)}
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

      {tab === "tags" && (
        <div className="space-y-4">
          {/* Global tag management */}
          <TagSelector
            allTags={tags}
            selectedTagIds={[]}
            onToggleTag={() => undefined}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
            onUpdateTagColor={onUpdateTagColor}
            label="All tags"
          />

          {/* Per-project tag assignment */}
          {projects.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                Tags per project
              </p>
              {projects.map((project) => (
                <div key={project.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full border border-zinc-300 dark:border-zinc-700"
                      style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
                    />
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{project.name}</span>
                  </div>
                  <TagSelector
                    allTags={tags}
                    selectedTagIds={(project.tags ?? []).map((t) => t.id)}
                    onToggleTag={(tagId) => {
                      const current = (project.tags ?? []).map((t) => t.id);
                      const next = current.includes(tagId)
                        ? current.filter((id) => id !== tagId)
                        : [...current, tagId];
                      void onUpdateProjectTags(project.id, next);
                    }}
                    onCreateTag={onCreateTag}
                    onUpdateTagColor={onUpdateTagColor}
                    compact
                    label="Project tags"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "delete" && projects.length > 0 && (
        <ul className="mt-4 divide-y divide-zinc-200 dark:divide-zinc-800">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-700 flex-shrink-0"
                  style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
                />
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
