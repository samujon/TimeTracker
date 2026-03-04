"use client";

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
import { useStatsData } from "../components/useStatsData";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend, Title);

import type { StatsView, StatsGroup } from "./useStatsData";

type Props = {
  view: StatsView;
  selectedDate: Date;
  groupBy: StatsGroup;
};

export default function StatsChart({ view, selectedDate, groupBy }: Props) {
  const { loading, data, error } = useStatsData(view, selectedDate, groupBy);

  // Helper: get all unique projects in the data
  const projectMap: Record<string, { name: string; color: string }> = {};
  data?.forEach((entry: any) => {
    const pid = entry.project_id || "(none)";
    const name = entry.projects?.name || "(none)";
    const color = entry.projects?.color || "#34d399";
    projectMap[pid] = { name, color };
  });
  const allProjectIds = Object.keys(projectMap);

  let labels: string[] = [];
  let datasets: any[] = [];

  if (groupBy === "period") {
    // Stacked by project, x-axis is period (day, week, hour)
    if (view === "weekly") {
      // Start week on Monday (ISO)
      labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      datasets = allProjectIds.map((pid) => {
        const dayTotals = Array(7).fill(0);
        data?.forEach((entry: any) => {
          if ((entry.project_id || "(none)") === pid) {
            const d = new Date(entry.started_at);
            // getDay: 0=Sun, 1=Mon, ..., 6=Sat; ISO: 1=Mon, ..., 7=Sun
            let isoDay = d.getDay();
            isoDay = isoDay === 0 ? 6 : isoDay - 1; // 0=Mon, ..., 6=Sun
            dayTotals[isoDay] += entry.duration_seconds || 0;
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
      // Group by ISO weeks in the selected month
      // Find all ISO weeks in the month
      const year = selectedDate.getFullYear();
      const month = selectedDate.getMonth();
      // Get first and last day of month
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      // Collect all ISO week numbers in the month
      const weekSet = new Set<number>();
      for (let d = new Date(firstDay); d <= lastDay; d.setDate(d.getDate() + 1)) {
        // ISO week: week starts on Monday
        const temp = new Date(d);
        const day = temp.getDay();
        const monday = new Date(temp);
        monday.setDate(temp.getDate() - ((day + 6) % 7));
        // Get ISO week number
        const jan4 = new Date(monday.getFullYear(), 0, 4);
        const week1Monday = new Date(jan4);
        week1Monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
        const weekNum = Math.round(((monday.getTime() - week1Monday.getTime()) / 86400000) / 7 + 1);
        weekSet.add(weekNum);
      }
      const weekNumbers = Array.from(weekSet).sort((a, b) => a - b);
      labels = weekNumbers.map((w) => `Week ${w}`);
      datasets = allProjectIds.map((pid) => {
        const weekTotals: Record<number, number> = {};
        weekNumbers.forEach((w) => (weekTotals[w] = 0));
        data?.forEach((entry: any) => {
          if ((entry.project_id || "(none)") === pid) {
            const d = new Date(entry.started_at);
            const temp = new Date(d);
            const day = temp.getDay();
            const monday = new Date(temp);
            monday.setDate(temp.getDate() - ((day + 6) % 7));
            const jan4 = new Date(monday.getFullYear(), 0, 4);
            const week1Monday = new Date(jan4);
            week1Monday.setDate(jan4.getDate() - ((jan4.getDay() + 6) % 7));
            const weekNum = Math.round(((monday.getTime() - week1Monday.getTime()) / 86400000) / 7 + 1);
            if (weekTotals[weekNum] !== undefined) {
              weekTotals[weekNum] += entry.duration_seconds || 0;
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
    } else if (view === "daily") {
      labels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
      datasets = allProjectIds.map((pid) => {
        const hourTotals = Array(24).fill(0);
        data?.forEach((entry: any) => {
          if ((entry.project_id || "(none)") === pid) {
            const d = new Date(entry.started_at);
            const hour = d.getHours();
            hourTotals[hour] += entry.duration_seconds || 0;
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
    // Not stacked: group by task for the period
    const projectTotals: Record<string, number> = {};
    allProjectIds.forEach((pid) => (projectTotals[pid] = 0));
    data?.forEach((entry: any) => {
      const pid = entry.project_id || "(none)";
      projectTotals[pid] += entry.duration_seconds || 0;
    });
    labels = allProjectIds.map((pid) => projectMap[pid].name);
    datasets = [
      {
        label: "Minutes Tracked",
        data: allProjectIds.map((pid) => Math.round(projectTotals[pid] / 60)),
        backgroundColor: allProjectIds.map((pid) => projectMap[pid].color),
      },
    ];
  }

  const chartData = {
    labels,
    datasets,
  };

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
      },
      x: {
        ticks: { color: "#a1a1aa" },
        grid: { color: "#27272a" },
        stacked: groupBy === "period",
      },
    },
  };

  if (loading) return <div className="text-zinc-400">Loading…</div>;
  if (error) return <div className="text-rose-400">{error}</div>;
  if (!labels.length) return <div className="text-zinc-500">No data for this period.</div>;

  return <Bar data={chartData} options={options} />;
}
