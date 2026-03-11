"use client";

import { useMemo } from "react";
import type { StatsEntry } from "./useStatsData";

type Props = {
    entries: StatsEntry[];
};

function fmt(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

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
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-3">Top tasks</h3>
            <div className="space-y-2.5">
                {tasks.map(([desc, secs]) => (
                    <div key={desc}>
                        <div className="flex justify-between text-xs mb-0.5">
                            <span className="truncate text-zinc-700 dark:text-zinc-200 pr-3">{desc}</span>
                            <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{fmt(secs)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <div
                                className="h-full rounded-full bg-emerald-500"
                                style={{ width: `${(secs / max) * 100}%` }}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
