/** Formats a duration in seconds as "Xh Ym" or "Ym" (e.g. "1h 30m", "45m"). */
export function formatDuration(totalSeconds: number): string {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
