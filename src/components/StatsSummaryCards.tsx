"use client";

import { useMemo } from "react";
import type { StatsEntry, StatsView } from "./useStatsData";
import { getPeriodRange } from "@/lib/timeUtils";

type Props = {
    entries: StatsEntry[];
    view: StatsView;
    selectedDate: Date;
};

function fmt(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function StatsSummaryCards({ entries, view, selectedDate }: Props) {
    const stats = useMemo(() => {
        const total = entries.reduce((sum, e) => sum + (e.duration_seconds ?? 0), 0);

        const { from, to } = getPeriodRange(view, selectedDate);
        const periodDays = Math.round((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
        const dailyAvg = periodDays > 0 ? total / periodDays : 0;

        const byDay: Record<string, number> = {};
        for (const e of entries) {
            const d = e.started_at.slice(0, 10);
            byDay[d] = (byDay[d] ?? 0) + (e.duration_seconds ?? 0);
        }
        let peakDayDate = "";
        let peakDaySeconds = 0;
        for (const [day, secs] of Object.entries(byDay)) {
            if (secs > peakDaySeconds) { peakDaySeconds = secs; peakDayDate = day; }
        }

        const byHour: Record<number, number> = {};
        for (const e of entries) {
            const h = new Date(e.started_at).getHours();
            byHour[h] = (byHour[h] ?? 0) + (e.duration_seconds ?? 0);
        }
        let peakHour = -1;
        let peakHourSeconds = 0;
        for (const [h, secs] of Object.entries(byHour)) {
            if (secs > peakHourSeconds) { peakHourSeconds = secs; peakHour = Number(h); }
        }

        return { total, dailyAvg, peakDayDate, peakDaySeconds, peakHour, peakHourSeconds };
    }, [entries, view, selectedDate]);

    if (entries.length === 0) return null;

    const cards = [
        {
            label: "Total tracked",
            value: fmt(stats.total),
            sub: null,
        },
        {
            label: "Daily average",
            value: fmt(Math.round(stats.dailyAvg)),
            sub: view !== "daily" ? "per day in period" : null,
        },
        {
            label: "Peak day",
            value: stats.peakDayDate
                ? new Date(stats.peakDayDate + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
                : "—",
            sub: stats.peakDaySeconds > 0 ? fmt(stats.peakDaySeconds) : null,
        },
        {
            label: "Peak hour",
            value: stats.peakHour >= 0 ? `${String(stats.peakHour).padStart(2, "0")}:00` : "—",
            sub: stats.peakHourSeconds > 0 ? fmt(stats.peakHourSeconds) : null,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {cards.map((card) => (
                <div
                    key={card.label}
                    className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-3"
                >
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">{card.label}</p>
                    <p className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{card.value}</p>
                    {card.sub && <p className="text-xs text-zinc-400 mt-0.5">{card.sub}</p>}
                </div>
            ))}
        </div>
    );
}
