"use client";

import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";
import { PeriodNav } from "@/components/stats/PeriodNav";
import type { StatsView as StatsViewType, StatsGroup } from "@/hooks/useStatsData";
import type { Tag } from "@/types";
import type { StatsExport } from "@/hooks/useStatsExport";

interface Props {
    view: StatsViewType;
    setView: (v: StatsViewType) => void;
    selectedDate: Date;
    onDateChange: (d: Date) => void;
    groupBy: StatsGroup;
    setGroupBy: (g: StatsGroup) => void;
    allTags: Tag[];
    filterTagIds: string[];
    setFilterTagIds: React.Dispatch<React.SetStateAction<string[]>>;
    statsExport: StatsExport;
}

export function StatsControls({
    view,
    setView,
    selectedDate,
    onDateChange,
    groupBy,
    setGroupBy,
    allTags,
    filterTagIds,
    setFilterTagIds,
    statsExport,
}: Props) {
    const { exportOpen, exportLoading, exportError, presets, dropdownRef, toggleOpen, handleExport } = statsExport;

    return (
        <>
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
                        onClick={toggleOpen}
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

            <PeriodNav view={view} selectedDate={selectedDate} onChange={onDateChange} />

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
        </>
    );
}
