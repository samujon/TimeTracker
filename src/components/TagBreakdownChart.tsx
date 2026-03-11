"use client";

import { useMemo } from "react";
import { Doughnut } from "react-chartjs-2";
import { Chart as ChartJS, DoughnutController, ArcElement, Tooltip, Legend } from "chart.js";
import type { TooltipItem } from "chart.js";
import type { StatsEntry } from "./useStatsData";
import { extractTagsFromJoin } from "@/lib/timeUtils";
import { DEFAULT_PROJECT_COLOR } from "@/lib/constants";

ChartJS.register(DoughnutController, ArcElement, Tooltip, Legend);

type Props = {
    entries: StatsEntry[];
};

export default function TagBreakdownChart({ entries }: Props) {
    const { labels, data, colors } = useMemo(() => {
        const tagMap: Record<string, { name: string; color: string; seconds: number }> = {};

        for (const entry of entries) {
            const dur = entry.duration_seconds ?? 0;
            if (dur <= 0) continue;

            const proj = Array.isArray(entry.projects) ? entry.projects[0] : entry.projects;
            const projectTags = extractTagsFromJoin(proj?.project_tags ?? []);
            const entryTags = extractTagsFromJoin(entry.entry_tags ?? []);

            const seen = new Set<string>();
            const uniqueTags = [...projectTags, ...entryTags].filter((t) => {
                if (seen.has(t.id)) return false;
                seen.add(t.id);
                return true;
            });

            if (uniqueTags.length === 0) continue;

            const perTag = dur / uniqueTags.length;
            for (const tag of uniqueTags) {
                if (!tagMap[tag.id]) {
                    tagMap[tag.id] = { name: tag.name, color: tag.color ?? DEFAULT_PROJECT_COLOR, seconds: 0 };
                }
                tagMap[tag.id].seconds += perTag;
            }
        }

        const sorted = Object.values(tagMap).sort((a, b) => b.seconds - a.seconds);
        return {
            labels: sorted.map((t) => t.name),
            data: sorted.map((t) => Math.round(t.seconds / 60)),
            colors: sorted.map((t) => t.color),
        };
    }, [entries]);

    if (labels.length === 0) return null;

    const chartData = {
        labels,
        datasets: [{ data, backgroundColor: colors, borderWidth: 0 }],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
            legend: { display: true, position: "right" as const },
            tooltip: {
                callbacks: {
                    label: (ctx: TooltipItem<"doughnut">) => {
                        const mins = ctx.raw as number;
                        const h = Math.floor(mins / 60);
                        const m = mins % 60;
                        return ` ${ctx.label}: ${h > 0 ? `${h}h ${m}m` : `${m}m`}`;
                    },
                },
            },
        },
    };

    return (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 px-4 py-4">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200 mb-4">Tag breakdown</h3>
            <div className="max-w-xs mx-auto">
                <Doughnut data={chartData} options={options} />
            </div>
        </div>
    );
}
