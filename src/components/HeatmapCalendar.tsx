"use client";

import { useMemo } from "react";
import type { DailyMap } from "./useHistoryData";
import { formatLocalDate, startOfISOWeek } from "@/lib/timeUtils";

type Props = {
    dailyMap: DailyMap;
};

const DAY_LABELS = ["Mon", "", "Wed", "", "Fri", "", "Sun"];
const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CELL_SIZE = 12;
const CELL_GAP = 2;
const CELL_STEP = CELL_SIZE + CELL_GAP;

function getCellColor(seconds: number, maxSeconds: number): string {
    const ratio = Math.min(seconds / maxSeconds, 1);
    if (ratio < 0.25) return "#d1fae5"; // emerald-100
    if (ratio < 0.5) return "#6ee7b7"; // emerald-300
    if (ratio < 0.75) return "#10b981"; // emerald-500
    return "#047857"; // emerald-700
}

function fmtTooltip(dateStr: string, seconds: number): string {
    if (seconds === 0) return `${dateStr}: No time tracked`;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${dateStr}: ${h > 0 ? `${h}h ${m}m` : `${m}m`} tracked`;
}

export function HeatmapCalendar({ dailyMap }: Props) {
    const { weeks, maxSeconds, monthLabels } = useMemo(() => {
        const today = new Date();
        const todayStr = formatLocalDate(today);

        // 52 full weeks back from Monday of the current week = 53 columns total
        const currentWeekStart = startOfISOWeek(today);
        const gridStart = new Date(currentWeekStart);
        gridStart.setDate(gridStart.getDate() - 51 * 7);
        const gridEnd = new Date(currentWeekStart);
        gridEnd.setDate(gridEnd.getDate() + 6); // Sunday of current week

        const weeks: { date: string; seconds: number; isToday: boolean; isFuture: boolean }[][] = [];
        const monthLabels: { weekIndex: number; label: string }[] = [];

        const d = new Date(gridStart);
        let lastMonth = -1;

        while (d <= gridEnd) {
            const week: { date: string; seconds: number; isToday: boolean; isFuture: boolean }[] = [];

            if (d.getMonth() !== lastMonth) {
                monthLabels.push({ weekIndex: weeks.length, label: MONTH_ABBR[d.getMonth()] });
                lastMonth = d.getMonth();
            }

            for (let i = 0; i < 7; i++) {
                const dateStr = formatLocalDate(d);
                week.push({
                    date: dateStr,
                    seconds: dailyMap.get(dateStr) ?? 0,
                    isToday: dateStr === todayStr,
                    isFuture: d > today,
                });
                d.setDate(d.getDate() + 1);
            }
            weeks.push(week);
        }

        const maxSeconds = Math.max(1, ...Array.from(dailyMap.values()));
        return { weeks, maxSeconds, monthLabels };
    }, [dailyMap]);

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4">Activity — last 12 months</h3>
            <div className="overflow-x-auto">
                <div className="inline-flex gap-1 items-start">
                    {/* Day labels column */}
                    <div className="flex flex-col mt-[18px]" style={{ gap: CELL_GAP }}>
                        {DAY_LABELS.map((label, i) => (
                            <div
                                key={i}
                                className="text-[9px] text-zinc-400 text-right pr-1"
                                style={{ height: CELL_SIZE, lineHeight: `${CELL_SIZE}px`, width: 24 }}
                            >
                                {label}
                            </div>
                        ))}
                    </div>

                    {/* Grid: month labels row + week columns */}
                    <div>
                        {/* Month labels */}
                        <div className="relative" style={{ height: 16 }}>
                            {monthLabels.map(({ weekIndex, label }) => (
                                <span
                                    key={`${label}-${weekIndex}`}
                                    className="absolute text-[9px] text-zinc-400"
                                    style={{ left: weekIndex * CELL_STEP }}
                                >
                                    {label}
                                </span>
                            ))}
                        </div>

                        {/* Week columns */}
                        <div className="flex" style={{ gap: CELL_GAP }}>
                            {weeks.map((week, wi) => (
                                <div key={wi} className="flex flex-col" style={{ gap: CELL_GAP }}>
                                    {week.map((day) => (
                                        <div
                                            key={day.date}
                                            title={day.isFuture ? undefined : fmtTooltip(day.date, day.seconds)}
                                            style={{
                                                width: CELL_SIZE,
                                                height: CELL_SIZE,
                                                ...(day.isToday ? { outline: "2px solid #10b981", outlineOffset: "-2px", borderRadius: 3 } : {}),
                                                ...(day.seconds > 0 && !day.isFuture
                                                    ? { backgroundColor: getCellColor(day.seconds, maxSeconds) }
                                                    : {}),
                                            }}
                                            className={`rounded-sm ${day.isFuture ? "opacity-0" : day.seconds === 0 ? "bg-zinc-100 dark:bg-zinc-800" : ""}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
