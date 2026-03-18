"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { fetchExportData } from "@/lib/exportData";
import { generateCSV, downloadCSV } from "@/lib/csvUtils";
import { getPeriodRange, getISOWeek, getISOWeekYear, getPreviousPeriodDate } from "@/lib/timeUtils";
import { useUser } from "@/context/UserContext";
import type { StatsView } from "@/hooks/useStatsData";

export type ExportPreset = {
    label: string;
    from: string | null;
    to: string | null;
    filename: string;
};

function buildPresets(view: StatsView, selectedDate: Date): ExportPreset[] {
    const now = new Date();

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

    const { from: weekFrom, to: weekTo } = getPeriodRange("weekly", now);
    const thisWeek = getISOWeek(now);
    const thisWeekYear = getISOWeekYear(now);

    const { from: monthFrom, to: monthTo } = getPeriodRange("monthly", now);
    const monthName = now.toLocaleString("en-US", { month: "short" }).toLowerCase();

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

export interface StatsExport {
    exportOpen: boolean;
    exportLoading: boolean;
    exportError: string | null;
    presets: ExportPreset[];
    dropdownRef: React.RefObject<HTMLDivElement | null>;
    toggleOpen: () => void;
    handleExport: (preset: ExportPreset) => Promise<void>;
    previousDate: Date;
}

export function useStatsExport(view: StatsView, selectedDate: Date): StatsExport {
    const [exportOpen, setExportOpen] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const { user } = useUser();

    const dropdownRef = useRef<HTMLDivElement | null>(null);
    const closeDropdown = useCallback(() => setExportOpen(false), []);
    useClickOutside(dropdownRef, closeDropdown, exportOpen);

    const presets = useMemo(() => buildPresets(view, selectedDate), [view, selectedDate]);

    const handleExport = async (preset: ExportPreset) => {
        setExportOpen(false);
        setExportLoading(true);
        setExportError(null);
        try {
            const rows = await fetchExportData(preset.from, preset.to, user?.id);
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

    const previousDate = useMemo(() => getPreviousPeriodDate(view, selectedDate), [view, selectedDate]);

    return {
        exportOpen,
        exportLoading,
        exportError,
        presets,
        dropdownRef,
        toggleOpen: () => setExportOpen((o) => !o),
        handleExport,
        previousDate,
    };
}
