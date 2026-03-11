"use client";

import { useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
  DoughnutController,
  ArcElement,
} from "chart.js";
import type { TooltipItem } from "chart.js";
import type { StatsView, StatsGroup, StatsEntry } from "@/hooks/useStatsData";
import { getISOWeek, extractProjectFields } from "@/lib/timeUtils";
import { useTheme } from "@/hooks/useTheme";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title, DoughnutController, ArcElement);

type Props = {
  view: StatsView;
  selectedDate: Date;
  groupBy: StatsGroup;
  loading: boolean;
  data: StatsEntry[];
  error: string | null;
};

type Dataset = {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  stack?: string;
};

/** Resolves the project name and colour for a fetched entry. */
function getProjectMeta(entry: StatsEntry): { name: string; color: string } {
  const { project_name, project_color } = extractProjectFields(entry.projects);
  return { name: project_name ?? "(none)", color: project_color ?? "#34d399" };
}

function fmtMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function StatsChart({ view, selectedDate, groupBy, loading, data, error }: Props) {
  const { theme } = useTheme();

  const tickColor = theme === "dark" ? "#a1a1aa" : "#52525b";
  const gridColor = theme === "dark" ? "#27272a" : "#e4e4e7";

  const { labels, datasets } = useMemo(() => {
    // Build a map of all unique projects in the returned data.
    const projectMap: Record<string, { name: string; color: string }> = {};
    data.forEach((entry) => {
      const pid = entry.project_id ?? "(none)";
      projectMap[pid] = getProjectMeta(entry);
    });
    const allProjectIds = Object.keys(projectMap);

    let labels: string[] = [];
    let datasets: Dataset[] = [];

    if (groupBy === "period") {
      if (view === "weekly") {
        // ISO week: Monday (index 0) … Sunday (index 6)
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        datasets = allProjectIds.map((pid) => {
          const dayTotals = Array<number>(7).fill(0);
          data.forEach((entry) => {
            if ((entry.project_id ?? "(none)") === pid) {
              const d = new Date(entry.started_at);
              // Convert JS getDay() (0=Sun) to ISO day index (0=Mon … 6=Sun)
              const isoIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
              dayTotals[isoIndex] += entry.duration_seconds ?? 0;
            }
          });
          return {
            label: projectMap[pid].name,
            data: dayTotals.map((s) => Math.round(s / 60)),
            backgroundColor: projectMap[pid].color,
            stack: "tasks",
          };
        });
      } else if (view === "monthly") {
        // Group by ISO week numbers present in the selected month.
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const weekSet = new Set<number>();
        for (
          let d = new Date(year, month, 1);
          d <= new Date(year, month + 1, 0);
          d.setDate(d.getDate() + 1)
        ) {
          weekSet.add(getISOWeek(d));
        }
        const weekNumbers = Array.from(weekSet).sort((a, b) => a - b);
        labels = weekNumbers.map((w) => `W${w}`);

        datasets = allProjectIds.map((pid) => {
          const weekTotals: Record<number, number> = {};
          weekNumbers.forEach((w) => (weekTotals[w] = 0));
          data.forEach((entry) => {
            if ((entry.project_id ?? "(none)") === pid) {
              const wn = getISOWeek(new Date(entry.started_at));
              if (weekTotals[wn] !== undefined) {
                weekTotals[wn] += entry.duration_seconds ?? 0;
              }
            }
          });
          return {
            label: projectMap[pid].name,
            data: weekNumbers.map((w) => Math.round(weekTotals[w] / 60)),
            backgroundColor: projectMap[pid].color,
            stack: "tasks",
          };
        });
      } else {
        // Daily view: group by hour of day (0–23)
        labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        datasets = allProjectIds.map((pid) => {
          const hourTotals = Array<number>(24).fill(0);
          data.forEach((entry) => {
            if ((entry.project_id ?? "(none)") === pid) {
              hourTotals[new Date(entry.started_at).getHours()] +=
                entry.duration_seconds ?? 0;
            }
          });
          return {
            label: projectMap[pid].name,
            data: hourTotals.map((s) => Math.round(s / 60)),
            backgroundColor: projectMap[pid].color,
            stack: "tasks",
          };
        });
      }
    } else {
      // groupBy === "task": one segment per project in a donut chart
      const projectTotals: Record<string, number> = {};
      allProjectIds.forEach((pid) => (projectTotals[pid] = 0));
      data.forEach((entry) => {
        const pid = entry.project_id ?? "(none)";
        projectTotals[pid] = (projectTotals[pid] ?? 0) + (entry.duration_seconds ?? 0);
      });
      labels = allProjectIds.map((pid) => projectMap[pid].name);
      datasets = [
        {
          label: "Minutes tracked",
          data: allProjectIds.map((pid) => Math.round(projectTotals[pid] / 60)),
          backgroundColor: allProjectIds.map((pid) => projectMap[pid].color),
        },
      ];
    }

    return { labels, datasets };
  }, [data, view, groupBy]);

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: tickColor },
        grid: { color: gridColor },
        stacked: true,
        title: { display: true, text: "Minutes", color: tickColor },
      },
      x: {
        ticks: { color: tickColor },
        grid: { color: gridColor },
        stacked: true,
      },
    },
  };

  if (loading) return <div className="text-zinc-400 text-sm">Loading…</div>;
  if (error) return <div className="text-rose-400 text-sm">{error}</div>;
  if (!labels.length) return <div className="text-zinc-500 text-sm">No data for this period.</div>;

  if (groupBy === "task") {
    const donutOptions = {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: true, position: "right" as const },
        tooltip: {
          callbacks: {
            label: (ctx: TooltipItem<"doughnut">) =>
              ` ${ctx.label}: ${fmtMinutes(ctx.raw as number)}`,
          },
        },
      },
    };
    return (
      <div className="flex items-center justify-center w-full h-full px-4">
        <div className="max-w-sm w-full">
          <Doughnut data={chartData} options={donutOptions} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full px-2">
      <Bar data={chartData} options={options} />
    </div>
  );
}

