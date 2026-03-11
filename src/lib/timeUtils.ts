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
    if (!match) return null;
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
