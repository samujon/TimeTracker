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
        <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="text-3xl font-mono tabular-nums text-[var(--color-text)]">{formattedElapsed}</div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                        {isRunning ? "Running" : "Stopped"}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onToggle}
                    disabled={saving}
                    className={`inline-flex items-center justify-center rounded-lg px-6 py-2 text-sm font-medium transition focus-ring ${isRunning
                        ? "bg-[var(--color-destructive)] text-white hover:opacity-90"
                        : "bg-[var(--color-primary)] text-[var(--color-primary-foreground)] hover:opacity-90"
                        } ${saving ? "opacity-70" : ""}`}
                >
                    {isRunning ? "Stop" : "Start"}
                </button>
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                    <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">Description</label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="What are you working on?"
                        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-1.5 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                    />
                </div>
                <div className="sm:max-w-xs">
                    <TagSelector
                        allTags={tags}
                        selectedTagIds={selectedEntryTagIds}
                        onToggleTag={(id) => setSelectedEntryTagIds((prev) => toggleArrayId(prev, id))}
                        onCreateTag={onCreateTag}
                        onDeleteTag={onDeleteTag}
                        compact
                        label="Tags"
                    />
                </div>
            </div>
            {error && <p className="mt-3 text-xs text-[var(--color-destructive)]">{error}</p>}
        </section>
    );
}
