import { getISOWeek, startOfISOWeek, endOfISOWeek } from "date-fns";
import type { Tag, TimeEntry, Project } from "@/types";

// Re-export date-fns ISO week helpers under project-consistent names.
export { getISOWeek, startOfISOWeek, endOfISOWeek };

/**
 * Returns the ISO week-year (the year that "owns" the ISO week).
 * Can differ from the calendar year for the first/last days of January/December.
 */
export function getISOWeekYear(date: Date): number {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    return d.getUTCFullYear();
}

/**
 * Parses a duration string entered by the user.
 * Accepted formats: "1:30", "01:30", "1h 30m", "90m", "1h", etc.
 * Returns total minutes, or null for unparseable input.
 */
export function parseDuration(str: string): number | null {
    if (!str) return null;

    // hh:mm or h:m
    const colonMatch = str.match(/^(\d{1,2}):(\d{1,2})$/);
    if (colonMatch) {
        const hours = parseInt(colonMatch[1], 10);
        const mins = parseInt(colonMatch[2], 10);
        if (isNaN(hours) || isNaN(mins) || mins > 59) return null;
        return hours * 60 + mins;
    }

    // "1h 15m", "90m", "2h", etc.
    const regex = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*m?)?/i;
    const match = str.match(regex);
    // Both capture groups are optional, so the regex matches any string.
    // Require at least one group to have actually matched a digit.
    if (!match || (!match[1] && !match[2])) return null;
    const hours = match[1] ? parseInt(match[1], 10) : 0;
    const mins = match[2] ? parseInt(match[2], 10) : 0;
    if (isNaN(hours) && isNaN(mins)) return null;
    return hours * 60 + mins;
}

/**
 * Normalises the `projects` join returned by Supabase.
 * The join can be either a single object or an array depending on relationship cardinality.
 */
export function extractProjectFields(projects: unknown): {
    project_name: string | null;
    project_color: string | null;
} {
    if (Array.isArray(projects)) {
        const p = projects[0] as { name?: string; color?: string } | undefined;
        return { project_name: p?.name ?? null, project_color: p?.color ?? null };
    }
    const p = projects as { name?: string; color?: string } | null;
    return { project_name: p?.name ?? null, project_color: p?.color ?? null };
}

/**
 * Builds the 15-minute-interval time options (e.g. "09:00", "09:15" …) used by
 * time-picker dropdowns.
 */
export function buildHourOptions(): string[] {
    const options: string[] = [];
    for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 15) {
            options.push(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`);
        }
    }
    return options;
}

/** Formats a Date as "yyyy-MM-dd" in local time. */
export function formatLocalDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, "0");
    const d = date.getDate().toString().padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Formats a Date as "HH:mm" in local time. */
export function formatLocalTime(date: Date): string {
    const h = date.getHours().toString().padStart(2, "0");
    const m = date.getMinutes().toString().padStart(2, "0");
    return `${h}:${m}`;
}

/**
 * Converts a total number of minutes into an "HH:MM" string.
 * Hours are not capped at 24, so 1500 minutes → "25:00".
 */
export function formatHoursMinutes(totalMinutes: number): string {
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Returns the union of project-inherited tags and entry-specific tags,
 * de-duplicated by tag id. Project tags come first.
 */
export function computeEffectiveTags(entry: TimeEntry, project?: Project | null): Tag[] {
    const seen = new Set<string>();
    const result: Tag[] = [];

    for (const tag of project?.tags ?? []) {
        if (!seen.has(tag.id)) {
            seen.add(tag.id);
            result.push(tag);
        }
    }
    for (const tag of entry.entry_tags ?? []) {
        if (!seen.has(tag.id)) {
            seen.add(tag.id);
            result.push(tag);
        }
    }
    return result;
}

/**
 * Extracts Tag objects from a Supabase nested join result of the shape:
 *   [ { tags: { id, name, color } }, … ]  or  { tags: { id, name, color } }
 *
 * Works for both `project_tags(tags(...))` and `entry_tags(tags(...))` joins.
 */
export function extractTagsFromJoin(raw: unknown): Tag[] {
    if (!raw) return [];
    const rows = Array.isArray(raw) ? raw : [raw];
    const result: Tag[] = [];
    for (const r of rows as Record<string, unknown>[]) {
        const t = r.tags as Record<string, unknown> | null | undefined;
        if (t && typeof t.id === "string" && typeof t.name === "string") {
            result.push({ id: t.id, name: t.name, color: (t.color as string | null | undefined) ?? null });
        }
    }
    return result;
}

/**
 * Toggles a string ID in an array — removes it if present, appends it otherwise.
 * Returns a new array; the original is not mutated.
 */
export function toggleArrayId(arr: string[], id: string): string[] {
    return arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id];
}

/** View granularity used by the stats chart and data hooks. */
export type StatsView = "daily" | "weekly" | "monthly";

/**
 * Returns the anchor date for the period immediately before the given one.
 * daily → 1 day back, weekly → 7 days back, monthly → 1 month back.
 */
export function getPreviousPeriodDate(view: StatsView, date: Date): Date {
    const d = new Date(date);
    if (view === "daily") {
        d.setDate(d.getDate() - 1);
    } else if (view === "weekly") {
        d.setDate(d.getDate() - 7);
    } else {
        d.setMonth(d.getMonth() - 1);
    }
    return d;
}

/**
 * Calculates the [from, to) date range for a given stats-view + anchor date,
 * using ISO 8601 weeks (Monday = first day of week).
 */
export function getPeriodRange(view: StatsView, date: Date): { from: Date; to: Date } {
    let from: Date;
    let to: Date;

    if (view === "daily") {
        from = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        to = new Date(from);
        to.setDate(to.getDate() + 1);
    } else if (view === "weekly") {
        from = startOfISOWeek(date);
        to = new Date(from);
        to.setDate(to.getDate() + 7);
    } else {
        from = new Date(date.getFullYear(), date.getMonth(), 1);
        to = new Date(date.getFullYear(), date.getMonth() + 1, 1);
    }

    return { from, to };
}

/**
 * Normalises a raw Supabase `time_entries` row (with nested `projects` and
 * `entry_tags` joins) into a typed `TimeEntry`, resolving both the flat project
 * name/color fields and the entry tag list.
 */
export function normaliseEntry(raw: Record<string, unknown>): TimeEntry {
    return {
        ...(raw as unknown as Omit<TimeEntry, "project_name" | "project_color" | "entry_tags">),
        ...extractProjectFields(raw.projects),
        entry_tags: extractTagsFromJoin(raw.entry_tags),
    };
}

