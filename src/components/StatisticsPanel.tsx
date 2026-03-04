import React, { useState } from "react";
import dynamic from "next/dynamic";
import { PeriodNav } from "@/components/PeriodNav";

const StatsChart = dynamic(() => import("@/components/StatsChart"), { ssr: false });

export function StatisticsPanel() {
  const [view, setView] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [groupBy, setGroupBy] = useState<"period" | "task">("period");

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Statistics</h1>
          <p className="mt-1 text-xs text-zinc-400">View your tracked time by day, week, or month.</p>
        </div>
      </header>
      <div className="flex gap-2 mb-6">
        <button onClick={() => setView("daily")} className={`px-4 py-2 rounded ${view === "daily" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}>Daily</button>
        <button onClick={() => setView("weekly")} className={`px-4 py-2 rounded ${view === "weekly" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}>Weekly</button>
        <button onClick={() => setView("monthly")} className={`px-4 py-2 rounded ${view === "monthly" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}>Monthly</button>
      </div>
      <PeriodNav view={view} selectedDate={selectedDate} onChange={setSelectedDate} />
      <div className="flex gap-2 mb-4">
        <button
          className={`px-3 py-1 rounded ${groupBy === "period" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}
          onClick={() => setGroupBy("period")}
        >
          Split by {view === "daily" ? "hour" : view === "weekly" ? "day" : "week"}
        </button>
        <button
          className={`px-3 py-1 rounded ${groupBy === "task" ? "bg-emerald-500 text-zinc-950" : "bg-zinc-800 text-zinc-100"}`}
          onClick={() => setGroupBy("task")}
        >
          Split by task
        </button>
      </div>
      <div className="h-80 flex items-center justify-center border border-zinc-800 rounded-xl bg-zinc-900/70">
        <StatsChart view={view} selectedDate={selectedDate} groupBy={groupBy} />
      </div>
    </div>
  );
}
