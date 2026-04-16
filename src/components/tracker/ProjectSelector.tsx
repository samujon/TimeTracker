"use client";

import React, { useState } from "react";
import type { Project, Tag } from "@/types";
import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { useDisclosure } from "@/hooks/useDisclosure";
import { TagSelector } from "@/components/shared/TagSelector";
import { ColorPicker } from "@/components/shared/ColorPicker";

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
    <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Projects</h2>
      </div>
      <div className="mb-4 flex gap-1.5">
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${tab === "main" ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"}`}
          onClick={() => setTab("main")}
        >
          Select/Add
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${tab === "tags" ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"}`}
          onClick={() => setTab("tags")}
        >
          Tags
        </button>
        <button
          type="button"
          className={`rounded-md px-3 py-1 text-xs font-medium transition ${tab === "delete" ? "bg-[var(--color-destructive)] text-white" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"}`}
          onClick={() => setTab("delete")}
        >
          Delete
        </button>
      </div>


      {tab === "main" && (
        <form onSubmit={handleCreateProject} className="flex flex-col gap-2">
          <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Project</label>
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
                className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                placeholder="Type or pick a project"
                disabled={creatingProject}
                autoComplete="off"
              />
              {dropdownDisclosure.open && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {projects.length === 0 && (
                    <div className="px-3 py-2 text-sm text-[var(--color-text-muted)]">No projects</div>
                  )}
                  {projects.map((project) => (
                    <div
                      key={project.id}
                      className={`flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[var(--color-surface-alt)] ${project.name === newProjectName ? "bg-[var(--color-surface-alt)]" : ""}`}
                      onMouseDown={() => {
                        setNewProjectName(project.name);
                        setSelectedProjectId(project.id);
                        dropdownDisclosure.close();
                      }}
                    >
                      <span
                        className="inline-block w-3 h-3 rounded-full"
                        style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
                      />
                      <span className="text-sm text-[var(--color-text)]">{project.name}</span>
                    </div>
                  ))}
                </div>
              )}
            {!existingProject && newProjectName.trim() && (
              <div className="relative flex-shrink-0">
                <button
                  type="button"
                  className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center cursor-pointer"
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
                    className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg flex flex-col items-center"
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
                className="inline-flex items-center justify-center rounded-lg bg-[var(--color-primary)] px-4 py-1.5 text-xs font-medium text-[var(--color-primary-foreground)] transition hover:opacity-90 disabled:opacity-60"
              >
                Add
              </button>
            )}
            {existingProject && (() => {
              const proj = existingProject;
              return (
                <div className="relative flex-shrink-0" ref={editColorDisclosure.ref}>
                  <button
                    type="button"
                    className="w-7 h-7 rounded-full border border-[var(--color-border)] flex items-center justify-center ml-2 cursor-pointer hover:ring-2 hover:ring-[var(--color-primary)] transition"
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
                      className="absolute z-30 left-1/2 -translate-x-1/2 mt-2 p-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg flex flex-col items-center"
                      style={{ minWidth: 180 }}
                      onMouseDown={e => e.preventDefault()}
                    >
                      <p className="text-[11px] text-[var(--color-text-muted)] mb-2">Edit project color</p>
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
        </form>
      )}

      {tab === "tags" && (
        <div className="space-y-4">
          <TagSelector
            allTags={tags}
            selectedTagIds={[]}
            onToggleTag={() => undefined}
            onCreateTag={onCreateTag}
            onDeleteTag={onDeleteTag}
            onUpdateTagColor={onUpdateTagColor}
            label="All tags"
          />

          {projects.length > 0 && (
            <div className="space-y-3 mt-4">
              <p className="text-[11px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
                Tags per project
              </p>
              {projects.map((project) => (
                <div key={project.id} className="border border-[var(--color-border)] rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="inline-block w-3 h-3 rounded-full"
                      style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
                    />
                    <span className="text-sm font-medium text-[var(--color-text)]">{project.name}</span>
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
        <ul className="mt-2 divide-y divide-[var(--color-border)]">
          {projects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-2">
              <div className="flex items-center gap-2">
                <span
                  className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: project.color ?? DEFAULT_PROJECT_COLOR }}
                />
                <span className="text-sm text-[var(--color-text)]">{project.name}</span>
              </div>
              <button
                type="button"
                onClick={() => onDeleteProject(project.id)}
                className="ml-2 rounded-md bg-[var(--color-destructive)] px-2.5 py-1 text-xs text-white hover:opacity-90 transition"
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
