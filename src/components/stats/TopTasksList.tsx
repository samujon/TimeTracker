"use client";

import { useMemo } from "react";
import type { StatsEntry } from "@/hooks/useStatsData";
import { formatDuration } from "@/lib/formatDuration";
type Props = {
    entries: StatsEntry[];
};

export function TopTasksList({ entries }: Props) {
    const tasks = useMemo(() => {
        const map: Record<string, number> = {};
        for (const e of entries) {
            const key = e.description?.trim() || "(no description)";
            map[key] = (map[key] ?? 0) + (e.duration_seconds ?? 0);
        }
        return Object.entries(map)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
    }, [entries]);

    if (tasks.length === 0) return null;

    const max = tasks[0][1];

    return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Top tasks</h3>
            <div className="space-y-2.5">
                {tasks.map(([desc, secs]) => (
                    <div key={desc}>
                        <div className="flex justify-between text-xs mb-0.5">
                            <span className="truncate text-[var(--color-text)] pr-3">{desc}</span>
                            <span className="shrink-0 text-[var(--color-text-secondary)]">{formatDuration(secs)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                            <div
                                className="h-full rounded-full bg-[var(--color-primary)]"
                                style={{ width: `${(secs / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
