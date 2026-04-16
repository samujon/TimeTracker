"use client";

import { useMemo } from "react";
import type { StatsEntry, StatsView } from "@/hooks/useStatsData";
import { extractProjectFields } from "@/lib/timeUtils";
import { formatDuration } from "@/lib/formatDuration";
type Props = {
    current: StatsEntry[];
    previous: StatsEntry[];
    view: StatsView;
};

function totalByProject(entries: StatsEntry[]): Record<string, { name: string; color: string; seconds: number }> {
    const map: Record<string, { name: string; color: string; seconds: number }> = {};
    for (const e of entries) {
        const pid = e.project_id ?? "(none)";
        const { project_name, project_color } = extractProjectFields(e.projects);
        if (!map[pid]) map[pid] = { name: project_name ?? "(no project)", color: project_color ?? "#34d399", seconds: 0 };
        map[pid].seconds += e.duration_seconds ?? 0;
    }
    return map;
}

function periodLabel(view: StatsView): string {
    if (view === "daily") return "yesterday";
    if (view === "weekly") return "last week";
    return "last month";
}

export function PeriodComparison({ current, previous, view }: Props) {
    const rows = useMemo(() => {
        const cur = totalByProject(current);
        const prev = totalByProject(previous);
        const allIds = new Set([...Object.keys(cur), ...Object.keys(prev)]);
        return Array.from(allIds).map((pid) => {
            const c = cur[pid]?.seconds ?? 0;
            const p = prev[pid]?.seconds ?? 0;
            const meta = cur[pid] ?? prev[pid];
            const delta = p > 0 ? Math.round(((c - p) / p) * 100) : null;
            return { pid, name: meta.name, color: meta.color, current: c, previous: p, delta };
        }).sort((a, b) => b.current - a.current);
    }, [current, previous]);

    if (rows.length === 0) return null;

    const currentTotal = current.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);
    const previousTotal = previous.reduce((s, e) => s + (e.duration_seconds ?? 0), 0);
    const totalDelta = previousTotal > 0
        ? Math.round(((currentTotal - previousTotal) / previousTotal) * 100)
        : null;

    return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-[var(--color-text)]">
                    Period comparison
                </h3>
                <span className={`text-sm font-medium ${totalDelta == null ? "text-[var(--color-text-muted)]" : totalDelta >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"}`}>
                    {totalDelta != null ? (totalDelta >= 0 ? `+${totalDelta}%` : `${totalDelta}%`) : "—"}
                    <span className="text-[var(--color-text-muted)] font-normal ml-1">vs {periodLabel(view)}</span>
                </span>
            </div>

            <div className="space-y-2.5">
                {rows.map((row) => {
                    const maxVal = Math.max(row.current, row.previous, 1);
                    return (
                        <div key={row.pid}>
                            <div className="flex items-center justify-between text-xs mb-1">
                                <div className="flex items-center gap-1.5">
                                    <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: row.color }} />
                                    <span className="text-[var(--color-text)] font-medium">{row.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[var(--color-text-secondary)]">
                                    <span>{formatDuration(row.current)}</span>
                                    <span className={`font-medium ${row.delta == null ? "text-[var(--color-text-muted)]" : row.delta >= 0 ? "text-[var(--color-success)]" : "text-[var(--color-destructive)]"}`}>
                                        {row.delta != null ? (row.delta >= 0 ? `+${row.delta}%` : `${row.delta}%`) : "new"}
                                    </span>
                                </div>
                            </div>
                            {/* Previous period: faint background bar */}
                            <div className="relative h-1.5 rounded-full bg-[var(--color-surface-alt)] overflow-hidden">
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full opacity-30"
                                    style={{ width: `${(row.previous / maxVal) * 100}%`, backgroundColor: row.color }}
                                />
                                {/* Current period: solid bar on top */}
                                <div
                                    className="absolute inset-y-0 left-0 rounded-full"
                                    style={{ width: `${(row.current / maxVal) * 100}%`, backgroundColor: row.color }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
