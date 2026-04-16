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
                <div className="flex gap-1">
                    {(["daily", "weekly", "monthly"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={`px-3 py-1.5 rounded-md text-sm font-medium capitalize transition ${view === v ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
                                }`}
                        >
                            {v}
                        </button>
                    ))}
                </div>

                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={toggleOpen}
                        disabled={exportLoading}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] disabled:opacity-50 transition-colors border border-[var(--color-border)]"
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
                            className="absolute right-0 mt-1 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg z-20 py-1 text-sm"
                        >
                            {presets.map((preset) => (
                                <button
                                    key={preset.label}
                                    role="option"
                                    onClick={() => void handleExport(preset)}
                                    className="w-full text-left px-4 py-2 hover:bg-[var(--color-surface-alt)] text-[var(--color-text)] transition-colors"
                                >
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {exportError && (
                <p className="text-sm text-[var(--color-destructive)]">{exportError}</p>
            )}

            <PeriodNav view={view} selectedDate={selectedDate} onChange={onDateChange} />

            <div className="flex gap-1">
                <button
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${groupBy === "period" ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
                        }`}
                    onClick={() => setGroupBy("period")}
                >
                    Split by {view === "daily" ? "hour" : view === "weekly" ? "day" : "week"}
                </button>
                <button
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${groupBy === "task" ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)]"
                        }`}
                    onClick={() => setGroupBy("task")}
                >
                    Split by project
                </button>
            </div>

            {/* Tag filter */}
            {allTags.length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium text-[var(--color-text-secondary)]">Filter by tag:</span>
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
                                className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-medium border transition ${
                                    active ? "border-transparent text-[var(--color-primary-foreground)]" : "border-transparent text-[var(--color-text)] opacity-50 hover:opacity-80"
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
                            className="text-[11px] text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline"
                        >
                            Clear filters
                        </button>
                    )}
                </div>
            )}
        </>
    );
}
