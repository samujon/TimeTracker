import React from "react";
import { StatsView } from "@/components/StatsView";

export function StatisticsPanel() {
  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Statistics</h1>
          <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">View your tracked time by day, week, or month.</p>
        </div>
      </header>
      <StatsView />
    </div>
  );
}
