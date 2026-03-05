import { getISOWeek, startOfISOWeek, endOfISOWeek } from "date-fns";

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
 * Formats a total-minutes value as zero-padded "hh:mm".
 * Handles durations >= 24 h by letting hours exceed 23.
 */
export function formatHoursMinutes(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const minutes = (totalMinutes % 60).toString().padStart(2, "0");
    return `${hours}:${minutes}`;
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
