"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { startOfISOWeek } from "@/lib/timeUtils";

export type StatsView = "daily" | "weekly" | "monthly";
export type StatsGroup = "period" | "task";

export type StatsEntry = {
  project_id: string | null;
  duration_seconds: number | null;
  started_at: string;
  projects: { name: string; color: string } | { name: string; color: string }[] | null;
};

export function useStatsData(
  view: StatsView,
  selectedDate: Date,
  // groupBy is intentionally excluded from the fetch — grouping is purely
  // client-side in StatsChart.  Keeping it as a parameter preserves the API.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _groupBy: StatsGroup = "period"
) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<StatsEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    // Calculate the [from, to) date range for the selected view.
    // All week calculations use ISO 8601 (Monday = start of week) to match
    // the Swedish calendar convention.
    let from: Date;
    let to: Date;

    if (view === "daily") {
      from = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      to = new Date(from);
      to.setDate(to.getDate() + 1);
    } else if (view === "weekly") {
      from = startOfISOWeek(selectedDate); // Monday of the selected week
      to = new Date(from);
      to.setDate(to.getDate() + 7);
    } else {
      from = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      to = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    }

    const fetchData = async () => {
      const { data: rows, error: err } = await supabase
        .from("time_entries")
        .select("project_id, duration_seconds, started_at, projects(name, color)")
        .gte("started_at", from.toISOString())
        .lt("started_at", to.toISOString());

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData((rows as StatsEntry[]) ?? []);
      }
      setLoading(false);
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
  }, [view, selectedDate]); // groupBy intentionally omitted — not used in query

  return { loading, data, error };
}

