import { useState } from "react";
import { ClipboardDocumentIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { TimeEntry } from "@/types";

type RecentEntriesProps = {
  entries: TimeEntry[];
  onDeleteEntry?: (id: string) => void;
  onEditEntry?: (entry: TimeEntry) => void;
  onCopyToManual?: (entry: TimeEntry) => void;
};

export function RecentEntries({ entries, onDeleteEntry, onEditEntry, onCopyToManual }: RecentEntriesProps) {
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
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-medium text-zinc-200">Recent entries</h2>
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

              return (
                <li
                  key={entry.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {entry.project_color && (
                        <span
                          className="inline-block h-3 w-3 rounded-full border border-zinc-700"
                          style={{ backgroundColor: entry.project_color }}
                          title="Project color"
                        />
                      )}
                      <p className="truncate text-zinc-100 font-medium">
                        {entry.project_name || "Untitled task"}
                      </p>
                    </div>
                    {entry.description?.trim() && (
                      <p className="truncate text-zinc-400 text-xs mt-0.5">
                        {entry.description}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {started.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                      {ended && (
                        <>
                          {" → "}
                          {ended.toLocaleString("sv-SE", { dateStyle: "short", timeStyle: "short" })}
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-200">
                      {hours}:{minutes}:{seconds}
                    </span>
                    {onCopyToManual && (
                      <button
                        type="button"
                        onClick={() => onCopyToManual(entry)}
                        className="rounded bg-blue-700 p-2 text-xs text-white hover:bg-blue-600"
                        title="Copy to manual entry"
                        aria-label="Copy"
                      >
                        <ClipboardDocumentIcon className="h-5 w-5" />
                      </button>
                    )}
                    {onEditEntry && (
                      <button
                        type="button"
                        onClick={() => onEditEntry(entry)}
                        className="rounded bg-emerald-700 p-2 text-xs text-white hover:bg-emerald-600"
                        title="Edit entry"
                        aria-label="Edit"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                    )}
                    {onDeleteEntry && (
                      <button
                        type="button"
                        onClick={() => handleDeleteClick(entry.id)}
                        className="rounded bg-rose-600 p-2 text-xs text-white hover:bg-rose-500"
                        title="Delete entry"
                        aria-label="Delete"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* Delete confirmation dialog */}
      {pendingDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-zinc-900 rounded-2xl p-6 w-full max-w-sm border border-zinc-700 shadow-xl text-center space-y-4">
            <p className="text-sm text-zinc-100">Delete this entry? This cannot be undone.</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => setPendingDeleteId(null)}
                className="px-4 py-2 rounded-full bg-zinc-700 text-zinc-200 text-xs font-medium hover:bg-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-full bg-rose-600 text-white text-xs font-medium hover:bg-rose-500"
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
