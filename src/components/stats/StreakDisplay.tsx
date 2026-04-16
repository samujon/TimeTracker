"use client";

type Props = {
    currentStreak: number;
    longestStreak: number;
    longestStreakThisYear: number;
};

export function StreakDisplay({ currentStreak, longestStreak, longestStreakThisYear }: Props) {
    const year = new Date().getFullYear();

    const stats = [
        { label: "Current streak", value: currentStreak },
        { label: "Longest streak", value: longestStreak },
        { label: `Best streak ${year}`, value: longestStreakThisYear },
    ];

    return (
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-4">
            <h3 className="text-sm font-semibold text-[var(--color-text)] mb-3">Streaks</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
                {stats.map((s) => (
                    <div key={s.label}>
                        <p className="text-3xl font-bold text-[var(--color-primary)]">{s.value}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                            {s.value === 1 ? "day" : "days"}
                        </p>
                        <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}
