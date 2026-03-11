"use client";

import { TagSelector } from "@/components/shared/TagSelector";
import { toggleArrayId } from "@/lib/timeUtils";
import type { Tag } from "@/types";

interface Props {
    isRunning: boolean;
    saving: boolean;
    formattedElapsed: string;
    description: string;
    setDescription: (value: string) => void;
    tags: Tag[];
    selectedEntryTagIds: string[];
    setSelectedEntryTagIds: React.Dispatch<React.SetStateAction<string[]>>;
    onToggle: () => void;
    onCreateTag: (name: string, color: string) => Promise<void>;
    onDeleteTag: (id: string) => Promise<void>;
    error: string | null;
}

export function TimerSection({
    isRunning,
    saving,
    formattedElapsed,
    description,
    setDescription,
    tags,
    selectedEntryTagIds,
    setSelectedEntryTagIds,
    onToggle,
    onCreateTag,
    onDeleteTag,
    error,
}: Props) {
    return (
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 p-6 mt-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="text-4xl font-mono tabular-nums sm:text-5xl">{formattedElapsed}</div>
                    <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                        {isRunning ? "Timer is running…" : "Timer is stopped."}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    disabled={saving}
                    className={`inline-flex items-center justify-center rounded-full px-8 py-3 text-sm font-medium shadow-lg shadow-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900 ${isRunning
                        ? "bg-rose-500 text-white hover:bg-rose-400"
                        : "bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
                        } ${saving ? "opacity-70" : ""}`}
                >
                    {isRunning ? "Stop" : "Start"}
                </button>
            </div>
            <div className="mt-6">
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300">Description (optional)</label>
                <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What are you working on?"
                    className="mt-2 w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
            </div>
            <div className="mt-4">
                <TagSelector
                    allTags={tags}
                    selectedTagIds={selectedEntryTagIds}
                    onToggleTag={(id) => setSelectedEntryTagIds((prev) => toggleArrayId(prev, id))}
                    onCreateTag={onCreateTag}
                    onDeleteTag={onDeleteTag}
                    compact
                    label="Entry tags (optional)"
                />
            </div>
            {error && <p className="mt-4 text-xs text-rose-400">{error}</p>}
        </section>
    );
}
