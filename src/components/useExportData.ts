"use client";

import { getSupabaseClient } from "@/lib/supabaseClient";
import { extractProjectFields } from "@/lib/timeUtils";
import { formatDurationHMS } from "@/lib/csvUtils";
import type { ExportRow } from "@/types";

/**
 * Fetches time entries for an optional [from, to) date range and maps them to
 * `ExportRow` objects ready for CSV generation.
 *
 * Pass `null` for `from` and/or `to` to skip that bound (i.e. "all time").
 */
export async function fetchExportData(
    from: string | null,
    to: string | null
): Promise<ExportRow[]> {
    const supabase = getSupabaseClient();
    if (!supabase) throw new Error("Supabase not configured");

    let query = supabase
        .from("time_entries")
        .select("id, description, project_id, started_at, ended_at, duration_seconds, projects(name)")
        .order("started_at", { ascending: true });

    if (from) query = query.gte("started_at", from);
    if (to) query = query.lt("started_at", to);

    const { data, error } = await query;
    if (error) throw new Error(error.message);

    return (data ?? []).map((row: Record<string, unknown>) => {
        const { project_name } = extractProjectFields(row.projects);
        const durationSec = row.duration_seconds as number | null;
        return {
            date: (row.started_at as string).slice(0, 10),
            project: project_name ?? "",
            description: (row.description as string | null) ?? "",
            started_at: row.started_at as string,
            ended_at: (row.ended_at as string | null) ?? "",
            duration_hms: durationSec != null ? formatDurationHMS(durationSec) : "",
            duration_seconds: durationSec ?? "",
        };
    });
}
