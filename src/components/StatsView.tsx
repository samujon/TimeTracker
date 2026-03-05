"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PeriodNav } from "@/components/PeriodNav";
import type { StatsView as StatsViewType, StatsGroup } from "@/components/useStatsData";

const StatsChart = dynamic(() => import("@/components/StatsChart"), {
    ssr: false,
    loading: () => <div className="text-zinc-400 text-sm">Loading chart…</div>,
});

/**
 * Self-contained statistics view: view-type toggle, period navigator,
 * group-by toggle, and the chart.  Used by both the embedded StatisticsPanel
 * and the /stats full-page route so the logic lives in exactly one place.
 */
export function StatsView() {
    const [view, setView] = useState<StatsViewType>("weekly");
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [groupBy, setGroupBy] = useState<StatsGroup>("period");

    return (
        <div className="space-y-4">
            {/* View type toggle */}
            <div className="flex gap-2">
                {(["daily", "weekly", "monthly"] as const).map((v) => (
                    <button
                        key={v}
                        onClick={() => setView(v)}
                        className={`px-4 py-2 rounded capitalize ${view === v ? "bg-emerald-500 text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                            }`}
                    >
                        {v.charAt(0).toUpperCase() + v.slice(1)}
                    </button>
                ))}
            </div>

            <PeriodNav view={view} selectedDate={selectedDate} onChange={setSelectedDate} />

            {/* Group-by toggle */}
            <div className="flex gap-2">
                <button
                    className={`px-3 py-1 rounded ${groupBy === "period" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        }`}
                    onClick={() => setGroupBy("period")}
                >
                    Split by {view === "daily" ? "hour" : view === "weekly" ? "day" : "week"}
                </button>
                <button
                    className={`px-3 py-1 rounded ${groupBy === "task" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                        }`}
                    onClick={() => setGroupBy("task")}
                >
                    Split by task
                </button>
            </div>

            {/* Chart */}
            <div className="h-80 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/70">
                <StatsChart view={view} selectedDate={selectedDate} groupBy={groupBy} />
            </div>
        </div>
    );
}
