"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { formatLocalDate } from "@/lib/timeUtils";
import { useUser } from "@/context/UserContext";

export type DailyMap = Map<string, number>; // "YYYY-MM-DD" → total seconds

/** Adds one calendar day to a "YYYY-MM-DD" string (timezone-safe). */
function nextDay(dateStr: string): string {
    const [y, m, d] = dateStr.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + 1);
    return formatLocalDate(dt);
}

function computeStreaks(activeDays: Set<string>) {
    const today = formatLocalDate(new Date());
    const yearStr = today.slice(0, 4);
    const sorted = Array.from(activeDays).sort();

    // Current streak – walk backwards from today (allow yesterday if today has no entry yet)
    let currentStreak = 0;
    const cur = new Date();
    if (!activeDays.has(formatLocalDate(cur))) {
        cur.setDate(cur.getDate() - 1);
    }
    while (activeDays.has(formatLocalDate(cur))) {
        currentStreak++;
        cur.setDate(cur.getDate() - 1);
    }

    // Longest streak overall (across full 12-month window)
    let longestStreak = 0;
    let streak = 0;
    let prev: string | null = null;
    for (const day of sorted) {
        if (prev && nextDay(prev) === day) {
            streak++;
        } else {
            streak = 1;
        }
        if (streak > longestStreak) longestStreak = streak;
        prev = day;
    }

    // Longest streak within the current calendar year
    const thisYearDays = sorted.filter((d) => d.startsWith(yearStr));
    let longestThisYear = 0;
    let streakY = 0;
    let prevY: string | null = null;
    for (const day of thisYearDays) {
        if (prevY && nextDay(prevY) === day) {
            streakY++;
        } else {
            streakY = 1;
        }
        if (streakY > longestThisYear) longestThisYear = streakY;
        prevY = day;
    }

    return { currentStreak, longestStreak, longestThisYear };
}

export function useHistoryData() {
    const [loading, setLoading] = useState(true);
    const [dailyMap, setDailyMap] = useState<DailyMap>(new Map());
    const [currentStreak, setCurrentStreak] = useState(0);
    const [longestStreak, setLongestStreak] = useState(0);
    const [longestStreakThisYear, setLongestStreakThisYear] = useState(0);
    const { user } = useUser();

    useEffect(() => {
        const supabase = getSupabaseClient();
        if (!supabase) {
            setLoading(false);
            return;
        }
        if (!user) {
            setLoading(false);
            return;
        }

        const from = new Date();
        from.setFullYear(from.getFullYear() - 1);

        let cancelled = false;

        const fetchData = async () => {
            const { data: rows } = await supabase
                .from("time_entries")
                .select("started_at, duration_seconds")
                .eq("user_id", user.id)
                .gte("started_at", from.toISOString());

            if (cancelled) return;

            const map: DailyMap = new Map();
            const activeDays = new Set<string>();

            for (const row of (rows ?? []) as { started_at: string; duration_seconds: number | null }[]) {
                if (!row.started_at) continue;
                const day = formatLocalDate(new Date(row.started_at));
                map.set(day, (map.get(day) ?? 0) + (row.duration_seconds ?? 0));
                activeDays.add(day);
            }

            const { currentStreak, longestStreak, longestThisYear } = computeStreaks(activeDays);
            setDailyMap(map);
            setCurrentStreak(currentStreak);
            setLongestStreak(longestStreak);
            setLongestStreakThisYear(longestThisYear);
            setLoading(false);
        };

        void fetchData();
        return () => {
            cancelled = true;
        };
    }, [user?.id]);

    return { loading, dailyMap, currentStreak, longestStreak, longestStreakThisYear };
}
