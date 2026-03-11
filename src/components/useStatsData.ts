"use client";

import { useEffect, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { startOfISOWeek } from "@/lib/timeUtils";
import type { Tag } from "@/types";

export type StatsView = "daily" | "weekly" | "monthly";
export type StatsGroup = "period" | "task";

export type StatsEntry = {
  project_id: string | null;
  duration_seconds: number | null;
  started_at: string;
  projects: {
    name: string;
    color: string;
    project_tags: { tag_id: string; tags: Tag | Tag[] | null }[];
  } | { name: string; color: string; project_tags: { tag_id: string; tags: Tag | Tag[] | null }[] }[] | null;
  entry_tags: { tag_id: string; tags: Tag | Tag[] | null }[] | null;
};

export function useStatsData(
  view: StatsView,
  selectedDate: Date,
  // groupBy is intentionally excluded from the fetch — grouping is purely
  // client-side in StatsChart.  Keeping it as a parameter preserves the API.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _groupBy: StatsGroup = "period",
  filterTagIds: string[] = []
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
        .select(
          "project_id, duration_seconds, started_at, " +
          "projects(name, color, project_tags(tag_id, tags(id, name, color))), " +
          "entry_tags(tag_id, tags(id, name, color))"
        )
        .gte("started_at", from.toISOString())
        .lt("started_at", to.toISOString());

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        let entries = ((rows ?? []) as unknown as StatsEntry[]);

        // Client-side OR tag filter — keep entries whose effective tag IDs
        // intersect the requested filterTagIds set.
        if (filterTagIds.length > 0) {
          const filterSet = new Set(filterTagIds);
          entries = entries.filter((entry) => {
            // Gather project tag IDs
            const proj = Array.isArray(entry.projects)
              ? entry.projects[0]
              : entry.projects;
            const projectTagIds = (proj?.project_tags ?? []).map((pt) => pt.tag_id);
            // Gather entry tag IDs
            const entryTagIds = (entry.entry_tags ?? []).map((et) => et.tag_id);
            const allTagIds = new Set([...projectTagIds, ...entryTagIds]);
            return [...filterSet].some((id) => allTagIds.has(id));
          });
        }

        setData(entries);
      }
      setLoading(false);
    };

    void fetchData();

    return () => {
      cancelled = true;
    };
    // Stringify filterTagIds so array reference changes don't cause spurious re-runs
    // while still responding to content changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, selectedDate, JSON.stringify(filterTagIds)]); // groupBy intentionally omitted — not used in query

  return { loading, data, error };
}

