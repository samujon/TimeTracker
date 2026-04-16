"use client";

import { useState } from "react";
import { Clipboard, Pencil, Trash2 } from "lucide-react";
import type { TimeEntry, Project } from "@/types";
import { computeEffectiveTags } from "@/lib/timeUtils";
import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";

type RecentEntriesProps = {
  entries: TimeEntry[];
  projects: Project[];
  onDeleteEntry?: (id: string) => void;
  onEditEntry?: (entry: TimeEntry) => void;
  onCopyToManual?: (entry: TimeEntry) => void;
};

export function RecentEntries({ entries, projects, onDeleteEntry, onEditEntry, onCopyToManual }: RecentEntriesProps) {
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  function handleDeleteClick(id: string) {
    setPendingDeleteId(id);
  }

  function confirmDelete() {
    if (pendingDeleteId) {
      onDeleteEntry?.(pendingDeleteId);
      setPendingDeleteId(null);
    }
  }
  return (
    <section>
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]">Recent entries</h2>
        <span className="text-[10px] uppercase tracking-wide text-[var(--color-text-muted)]">
          Last 10
        </span>
      </div>
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
        {entries.length === 0 ? (
          <div className="px-4 py-6 text-xs text-[var(--color-text-muted)]">
            No entries yet. Start the timer to create your first one.
          </div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-surface-alt)]">
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Project</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)] hidden sm:table-cell">Description</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)] hidden sm:table-cell">Tags</th>
                <th className="px-3 py-2 text-left font-medium text-[var(--color-text-secondary)]">Time</th>
                <th className="px-3 py-2 text-right font-medium text-[var(--color-text-secondary)]">Duration</th>
                <th className="px-3 py-2 text-right font-medium text-[var(--color-text-secondary)] sr-only">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-subtle)]">
            {entries.map((entry) => {
              const started = new Date(entry.started_at);
              const ended = entry.ended_at ? new Date(entry.ended_at) : null;
              const duration =
                entry.duration_seconds ?? (ended
                  ? Math.floor((ended.getTime() - started.getTime()) / 1000)
                  : null);
              const hours =
                duration !== null
                  ? Math.floor(duration / 3600).toString().padStart(2, "0")
                  : "--";
              const minutes =
                duration !== null
                  ? Math.floor((duration % 3600) / 60).toString().padStart(2, "0")
                  : "--";
              const seconds =
                duration !== null
                  ? (duration % 60).toString().padStart(2, "0")
                  : "--";

              const project = projects.find((p) => p.id === entry.project_id);
              const effectiveTags = computeEffectiveTags(entry, project);
              const inheritedTagIds = new Set((project?.tags ?? []).map((t) => t.id));

              return (
                <tr
                  key={entry.id}
                  className="group hover:bg-[var(--color-surface-alt)] transition-colors"
                >
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1.5">
                      {entry.project_color && (
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: entry.project_color }}
                        />
                      )}
                      <span className="text-[var(--color-text)] font-medium truncate max-w-[120px]">
                        {entry.project_name || "Untitled"}
                      </span>
                    </div>
                    {entry.description?.trim() && (
                      <p className="truncate text-[var(--color-text-muted)] text-[10px] mt-0.5 sm:hidden">
                        {entry.description}
                      </p>
                    )}
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell text-[var(--color-text-secondary)] max-w-[160px] truncate">
                    {entry.description || <span className="text-[var(--color-text-muted)] italic">—</span>}
                  </td>
                  <td className="px-3 py-2 hidden sm:table-cell">
                    {effectiveTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {effectiveTags.map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium"
                            style={{
                              backgroundColor: tag.color ? tag.color + "22" : "#6366f122",
                              color: tag.color ?? "#6366f1",
                              opacity: inheritedTagIds.has(tag.id) ? 0.6 : 1,
                            }}
                          >
                            {tag.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-[var(--color-text-muted)] whitespace-nowrap tabular-nums">
                    {started.toLocaleString("sv-SE", { timeStyle: "short" })}
                    {ended && ` – ${ended.toLocaleString("sv-SE", { timeStyle: "short" })}`}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <span className="font-mono tabular-nums text-[var(--color-text)]">
                      {hours}:{minutes}:{seconds}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <span className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onCopyToManual && (
                        <button
                          type="button"
                          onClick={() => onCopyToManual(entry)}
                          className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
                          title="Copy to manual entry"
                        >
                          <Clipboard className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onEditEntry && (
                        <button
                          type="button"
                          onClick={() => onEditEntry(entry)}
                          className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-primary-light)] hover:text-[var(--color-primary)] transition-colors"
                          title="Edit entry"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {onDeleteEntry && (
                        <button
                          type="button"
                          onClick={() => handleDeleteClick(entry.id)}
                          className="rounded-md p-1 text-[var(--color-text-muted)] hover:bg-[var(--color-destructive-light)] hover:text-[var(--color-destructive)] transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </span>
                  </td>
                </tr>
              );
            })}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-[var(--color-surface)] rounded-lg p-6 w-full max-w-sm border border-[var(--color-border)] shadow-xl text-center space-y-4">
            <p className="text-sm text-[var(--color-text)]">Delete this entry? This cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-1.5 rounded-lg bg-[var(--color-surface-alt)] text-[var(--color-text-secondary)] text-xs font-medium hover:bg-[var(--color-bg)] border border-[var(--color-border)] transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-1.5 rounded-lg bg-[var(--color-destructive)] text-white text-xs font-medium hover:opacity-90 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
