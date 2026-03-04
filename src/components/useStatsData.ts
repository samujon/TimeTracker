"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";

export type StatsView = "daily" | "weekly" | "monthly";
export type StatsGroup = "period" | "task";

export function useStatsData(
  view: StatsView,
  selectedDate: Date,
  groupBy: StatsGroup = "period"
) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase not configured");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    // Calculate date range for the selected view and date
    let from: Date, to: Date;
    if (view === "daily") {
      from = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      to = new Date(from);
      to.setDate(to.getDate() + 1);
    } else if (view === "weekly") {
      const day = selectedDate.getDay();
      from = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - day);
      to = new Date(from);
      to.setDate(to.getDate() + 7);
    } else {
      from = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
      to = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
    }

    supabase
      .from("time_entries")
      .select("project_id, duration_seconds, started_at, projects(name, color)")
      .gte("started_at", from.toISOString())
      .lt("started_at", to.toISOString())
      .then(({ data, error }) => {
        if (error) {
          setError(error.message);
          setData([]);
        } else {
          setData(data || []);
        }
        setLoading(false);
      });
  }, [view, selectedDate, groupBy]);

  return { loading, data, error };
}
