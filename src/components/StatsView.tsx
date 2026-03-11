"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { PeriodNav } from "@/components/PeriodNav";
import { fetchExportData } from "@/components/useExportData";
import { generateCSV, downloadCSV } from "@/lib/csvUtils";
import { getPeriodRange, getISOWeek, getISOWeekYear } from "@/lib/timeUtils";
import { useClickOutside } from "@/hooks/useClickOutside";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { TagSelector } from "@/components/TagSelector";
import type { Tag } from "@/types";
import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import type { StatsView as StatsViewType, StatsGroup } from "@/components/useStatsData";

type ExportPreset = {
    label: string;
    from: string | null;
    to: string | null;
    filename: string;
};

function buildPresets(view: StatsViewType, selectedDate: Date): ExportPreset[] {
    const now = new Date();

    // ── Current period ──────────────────────────────────────────────────────
    const { from: periodFrom, to: periodTo } = getPeriodRange(view, selectedDate);
    let periodFilename: string;

    if (view === "daily") {
        periodFilename = `time-entries-${periodFrom.toISOString().slice(0, 10)}.csv`;
    } else if (view === "weekly") {
        const week = getISOWeek(selectedDate);
        const year = getISOWeekYear(selectedDate);
        periodFilename = `time-entries-W${String(week).padStart(2, "0")}-${year}.csv`;
    } else {
        const month = selectedDate.toLocaleString("en-US", { month: "short" }).toLowerCase();
        periodFilename = `time-entries-${selectedDate.getFullYear()}-${month}.csv`;
    }

    // ── This week ───────────────────────────────────────────────────────────
    const { from: weekFrom, to: weekTo } = getPeriodRange("weekly", now);
    const thisWeek = getISOWeek(now);
    const thisWeekYear = getISOWeekYear(now);

    // ── This month ──────────────────────────────────────────────────────────
    const { from: monthFrom, to: monthTo } = getPeriodRange("monthly", now);
    const monthName = now.toLocaleString("en-US", { month: "short" }).toLowerCase();

    // ── This year ───────────────────────────────────────────────────────────
    const yearFrom = new Date(now.getFullYear(), 0, 1);
    const yearTo = new Date(now.getFullYear() + 1, 0, 1);

    return [
        {
            label: `Current ${view === "daily" ? "day" : view === "weekly" ? "week" : "month"}`,
            from: periodFrom.toISOString(),
            to: periodTo.toISOString(),
            filename: periodFilename,
        },
        {
            label: "This week",
            from: weekFrom.toISOString(),
            to: weekTo.toISOString(),
            filename: `time-entries-W${String(thisWeek).padStart(2, "0")}-${thisWeekYear}.csv`,
        },
        {
            label: "This month",
            from: monthFrom.toISOString(),
            to: monthTo.toISOString(),
            filename: `time-entries-${now.getFullYear()}-${monthName}.csv`,
        },
        {
            label: "This year",
            from: yearFrom.toISOString(),
            to: yearTo.toISOString(),
            filename: `time-entries-${now.getFullYear()}.csv`,
        },
        {
            label: "All time",
            from: null,
            to: null,
            filename: "time-entries-all.csv",
        },
    ];
}

const StatsChart = dynamic(() => import("@/components/StatsChart"), {
    ssr: false,
    loading: () => <div className="text-zinc-400 text-sm">Loading chart…</div>,
});

/**
 * Self-contained statistics view: view-type toggle, period navigator,
 * group-by toggle, chart, and CSV export.
 */
export function StatsView() {
    const [view, setView] = useState<StatsViewType>("weekly");
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [groupBy, setGroupBy] = useState<StatsGroup>("period");

    // Tags for filter
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [filterTagIds, setFilterTagIds] = useState<string[]>([]);

    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase) return;
        void supabase
            .from("tags")
            .select("id, name, color")
            .order("created_at", { ascending: true })
            .then(({ data }) => {
                if (data) setAllTags(data as Tag[]);
            });
    }, []);

    // Export dropdown state
    const [exportOpen, setExportOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const closeDropdown = useCallback(() => setExportOpen(false), []);
    useClickOutside(dropdownRef, closeDropdown, exportOpen);

    const handleExport = async (preset: ExportPreset) => {
        setExportOpen(false);
        setExportLoading(true);
        setExportError(null);
        try {
            const rows = await fetchExportData(preset.from, preset.to);
            if (rows.length === 0) {
                setExportError("No entries found for that period.");
            } else {
                downloadCSV(generateCSV(rows), preset.filename);
            }
        } catch (err) {
            setExportError(err instanceof Error ? err.message : "Export failed.");
        } finally {
            setExportLoading(false);
        }
    };

    const presets = useMemo(() => buildPresets(view, selectedDate), [view, selectedDate]);

    return (
        <div className="space-y-4">
            {/* View type toggle + Export button */}
            <div className="flex items-center justify-between gap-2">
                <div className="flex gap-2">
                    {(["daily", "weekly", "monthly"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-4 py-2 rounded capitalize ${view === v ? "bg-emerald-500 text-zinc-950" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100"
                                }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                {/* Export dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setExportOpen((o) => !o)}
                        disabled={exportLoading}
                        className="flex items-center gap-1.5 px-3 py-2 rounded text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 disabled:opacity-50 transition-colors"
                        aria-haspopup="listbox"
                        aria-expanded={exportOpen}
                    >
                        {exportLoading ? (
                            <>
                                <span className="animate-spin inline-block w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full" aria-hidden="true" />
                                Exporting…
                            </>
                        ) : (
                            <>
                                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                                    <path d="M8 1v9M4 7l4 4 4-4M2 13h12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                                Export CSV
                            </>
                        )}
                    </button>

                    {exportOpen && (
                        <div
                            role="listbox"
                            className="absolute right-0 mt-1 w-48 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg z-20 py-1 text-sm"
                        >
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    role="option"
                                    onClick={() => void handleExport(preset)}
                                    className="w-full text-left px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-100 transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {exportError && (
                <p className="text-sm text-red-500 dark:text-red-400">{exportError}</p>
            )}

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
                    Split by project
                </button>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Filter by tag:</span>
                    {allTags.map((tag) => {
                        const active = filterTagIds.includes(tag.id);
                        return (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() =>
                                    setFilterTagIds((prev) =>
                                        active ? prev.filter((id) => id !== tag.id) : [...prev, tag.id]
                                    )
                                }
                                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium border-2 transition ${
                                    active ? "border-transparent text-zinc-950" : "border-transparent text-zinc-900 dark:text-zinc-100 opacity-50 hover:opacity-80"
                                }`}
                                style={{
                                    backgroundColor: active ? (tag.color ?? DEFAULT_PROJECT_COLOR) : "transparent",
                                    borderColor: tag.color ?? DEFAULT_PROJECT_COLOR,
                                }}
                                title={active ? `Remove filter: ${tag.name}` : `Filter by: ${tag.name}`}
                            >
                                <span
                                    className="inline-block w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: tag.color ?? DEFAULT_PROJECT_COLOR }}
                                />
                                {tag.name}
                            </button>
                        );
                    })}
                    {filterTagIds.length > 0 && (
                        <button
                            type="button"
                            onClick={() => setFilterTagIds([])}
                            className="text-[11px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}

            {/* Chart */}
            <div className="h-80 flex items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/70">
                <StatsChart view={view} selectedDate={selectedDate} groupBy={groupBy} filterTagIds={filterTagIds} />
            </div>
        </div>
    );
}
