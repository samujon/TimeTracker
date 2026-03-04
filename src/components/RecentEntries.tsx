import React from "react";

type TimeEntry = {
  id: string;
  description: string | null;
  project_id: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
};

type RecentEntriesProps = {
  entries: TimeEntry[];
  onDeleteEntry?: (id: string) => void;
};

export function RecentEntries({ entries, onDeleteEntry }: RecentEntriesProps) {
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
                    <p className="truncate text-zinc-100">
                      {entry.description || "Untitled session"}
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-500">
                      {started.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="shrink-0 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 font-mono text-[11px] tabular-nums text-zinc-200">
                      {hours}:{minutes}:{seconds}
                    </span>
                    {onDeleteEntry && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="rounded bg-rose-600 px-2 py-1 text-xs text-white hover:bg-rose-500"
                        title="Delete entry"
                      >
                        Delete
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
