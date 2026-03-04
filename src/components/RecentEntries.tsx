import { ClipboardDocumentIcon, PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import { EditEntryModal } from "./EditEntryModal";

type TimeEntry = {
  id: string;
  description: string | null;
  project_id: string | null;
  project_name?: string | null;
  project_color?: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

type RecentEntriesProps = {
  entries: TimeEntry[];
  onDeleteEntry?: (id: string) => void;
  onEditEntry?: (entry: TimeEntry) => void;
  onCopyToManual?: (entry: TimeEntry) => void;
};

export function RecentEntries({ entries, onDeleteEntry, onEditEntry, onCopyToManual }: RecentEntriesProps) {
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
                        onClick={() => onDeleteEntry(entry.id)}
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
    </section>
  );
}
