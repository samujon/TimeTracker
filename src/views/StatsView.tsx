"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useStatsExport } from "@/hooks/useStatsExport";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useUser } from "@/context/UserContext";
import type { Tag } from "@/types";
import { useStatsData } from "@/hooks/useStatsData";
import type { StatsView as StatsViewType, StatsGroup } from "@/hooks/useStatsData";
import { useHistoryData } from "@/hooks/useHistoryData";
import { StatsSummaryCards } from "@/components/stats/StatsSummaryCards";
import { PeriodComparison } from "@/components/stats/PeriodComparison";
import { TopTasksList } from "@/components/stats/TopTasksList";
import { HeatmapCalendar } from "@/components/stats/HeatmapCalendar";
import { StreakDisplay } from "@/components/stats/StreakDisplay";
import { StatsControls } from "@/components/stats/StatsControls";

const StatsChart = dynamic(() => import("@/components/stats/StatsChart"), {
    ssr: false,
    loading: () => <div className="text-zinc-400 text-sm">Loading chart…</div>,
});

/**
 * Self-contained statistics view: controls, chart, and rich stats panels.
 */
export function StatsView() {
    const [view, setView] = useState<StatsViewType>("weekly");
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
    const [groupBy, setGroupBy] = useState<StatsGroup>("period");
    const [allTags, setAllTags] = useState<Tag[]>([]);
    const [filterTagIds, setFilterTagIds] = useState<string[]>([]);
    const { user } = useUser();

    const statsExport = useStatsExport(view, selectedDate);

    const { loading: currentLoading, data: currentData, error: currentError } =
        useStatsData(view, selectedDate, "period", filterTagIds);

    const { data: previousData } = useStatsData(view, statsExport.previousDate, "period", filterTagIds);

    const { loading: historyLoading, dailyMap, currentStreak, longestStreak, longestStreakThisYear } =
        useHistoryData();

    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase || !user) return;
        void supabase
            .from("tags")
            .select("id, name, color")
            .eq("user_id", user.id)
            .order("created_at", { ascending: true })
            .then(({ data }) => {
                if (data) setAllTags(data as Tag[]);
            });
    }, [user?.id]);

    return (
        <div className="space-y-4">
            <StatsControls
                view={view}
                setView={setView}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
                groupBy={groupBy}
                setGroupBy={setGroupBy}
                allTags={allTags}
                filterTagIds={filterTagIds}
                setFilterTagIds={setFilterTagIds}
                statsExport={statsExport}
            />

            {/* Chart */}
            <div className="h-[28rem] flex items-center justify-center border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900/70">
                <StatsChart
                    view={view}
                    selectedDate={selectedDate}
                    groupBy={groupBy}
                    loading={currentLoading}
                    data={currentData}
                    error={currentError}
                />
            </div>

            <StatsSummaryCards entries={currentData} view={view} selectedDate={selectedDate} />
            <PeriodComparison current={currentData} previous={previousData} view={view} />
            <TopTasksList entries={currentData} />

            {!historyLoading && (
                <>
                    <HeatmapCalendar dailyMap={dailyMap} />
                    <StreakDisplay
                        currentStreak={currentStreak}
                        longestStreak={longestStreak}
                        longestStreakThisYear={longestStreakThisYear}
                    />
                </>
            )}
        </div>
    );
}

