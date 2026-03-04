"use client";
import { useState } from "react";
import { TimeTracker } from "@/components/TimeTracker";
import { StatisticsPanel } from "@/components/StatisticsPanel";

export default function Home() {
  const [tab, setTab] = useState<"tracker" | "stats">("tracker");
  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-950 px-4 py-12 text-zinc-100">
      <div className="w-full max-w-3xl">
        {/* Tabs/bookmarks UI */}
        <div className="flex mb-0 w-full">
          <button
            className={`w-1/2 px-6 py-2 rounded-t-2xl font-medium text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
              ${tab === "tracker" ? "bg-zinc-900 border-x border-t border-zinc-800 text-emerald-400 shadow-lg shadow-black/20" : "bg-zinc-800 text-zinc-400 hover:text-emerald-400"}`}
            onClick={() => setTab("tracker")}
          >
            Time Tracker
          </button>
          <button
            className={`w-1/2 px-6 py-2 rounded-t-2xl font-medium text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-900
              ${tab === "stats" ? "bg-zinc-900 border-x border-t border-zinc-800 text-emerald-400 shadow-lg shadow-black/20" : "bg-zinc-800 text-zinc-400 hover:text-emerald-400"}`}
            onClick={() => setTab("stats")}
          >
            Statistics
          </button>
        </div>
        <div className="rounded-b-2xl border-x border-b border-zinc-800 bg-zinc-900/60 p-8">
          {tab === "tracker" ? <TimeTracker /> : <StatisticsPanel />}
        </div>
      </div>
    </div>
  );
}
