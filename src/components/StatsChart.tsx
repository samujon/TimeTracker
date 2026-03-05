"use client";

import { useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  Title,
} from "chart.js";
import { useStatsData } from "./useStatsData";
import type { StatsView, StatsGroup, StatsEntry } from "./useStatsData";
import { getISOWeek } from "@/lib/timeUtils";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

type Props = {
  view: StatsView;
  selectedDate: Date;
  groupBy: StatsGroup;
};

type Dataset = {
  label: string;
  data: number[];
  backgroundColor: string | string[];
  stack?: string;
};

/** Resolves the project name and colour for a fetched entry. */
function getProjectMeta(entry: StatsEntry): { name: string; color: string } {
  const p = Array.isArray(entry.projects) ? entry.projects[0] : entry.projects;
  return { name: p?.name ?? "(none)", color: p?.color ?? "#34d399" };
}

export default function StatsChart({ view, selectedDate, groupBy }: Props) {
  const { loading, data, error } = useStatsData(view, selectedDate, groupBy);

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
        labels = ["Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];
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
        labels = weekNumbers.map((w) => `v. ${w}`);

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
      // groupBy === "task": one bar per project, total for the period
      const projectTotals: Record<string, number> = {};
      allProjectIds.forEach((pid) => (projectTotals[pid] = 0));
      data.forEach((entry) => {
        const pid = entry.project_id ?? "(none)";
        projectTotals[pid] = (projectTotals[pid] ?? 0) + (entry.duration_seconds ?? 0);
      });
      labels = allProjectIds.map((pid) => projectMap[pid].name);
      datasets = [
        {
          label: "Minuter spårade",
          data: allProjectIds.map((pid) => Math.round(projectTotals[pid] / 60)),
          backgroundColor: allProjectIds.map((pid) => projectMap[pid].color),
        },
      ];
    }

    return { labels, datasets };
  }, [data, view, selectedDate, groupBy]);

  const chartData = { labels, datasets };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: true },
      title: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: "#a1a1aa" },
        grid: { color: "#27272a" },
        stacked: groupBy === "period",
        title: { display: true, text: "Minuter", color: "#a1a1aa" },
      },
      x: {
        ticks: { color: "#a1a1aa" },
        grid: { color: "#27272a" },
        stacked: groupBy === "period",
      },
    },
  };

  if (loading) return <div className="text-zinc-400 text-sm">Laddar…</div>;
  if (error) return <div className="text-rose-400 text-sm">{error}</div>;
  if (!labels.length) return <div className="text-zinc-500 text-sm">Ingen data för denna period.</div>;

  return <Bar data={chartData} options={options} />;
}

