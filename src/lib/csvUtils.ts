/**
 * Client-side utilities for generating and downloading CSV files.
 */

/** Escapes a single CSV cell, quoting it when necessary. */
function escapeCSVCell(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
        return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
}

/**
 * Converts an array of flat objects into a CSV string.
 * Column order follows the key order of the first row.
 */
export function generateCSV<T extends Record<string, string | number | null | undefined>>(
    rows: T[]
): string {
    if (rows.length === 0) return "";
    const headers = Object.keys(rows[0]);
    const headerRow = headers.map(escapeCSVCell).join(",");
    const dataRows = rows.map((row) => headers.map((h) => escapeCSVCell(row[h])).join(","));
    return [headerRow, ...dataRows].join("\n");
}

/**
 * Triggers a browser download of the given CSV string as a `.csv` file.
 * No server round-trip required — uses Blob + createObjectURL.
 */
export function downloadCSV(csv: string, filename: string): void {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

/**
 * Formats a duration in whole seconds as "HH:MM:SS".
 */
export function formatDurationHMS(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map((v) => v.toString().padStart(2, "0")).join(":");
}
