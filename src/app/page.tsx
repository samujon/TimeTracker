"use client";
import { useState } from "react";
import { TimeTracker } from "@/views/TimeTracker";
import { StatsView } from "@/views/StatsView";
import { EditorView } from "@/views/EditorView";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AuthGate } from "@/components/AuthGate";
import { useUser } from "@/context/UserContext";

function UserBar() {
  const { user, signOut } = useUser();
  return (
    <div className="flex items-center justify-end gap-3 mb-2 text-xs text-zinc-400 dark:text-zinc-500">
      <span className="truncate max-w-[200px]">{user?.email}</span>
      <button
        onClick={signOut}
        className="rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:border-red-200 dark:hover:border-red-800 transition-colors"
      >
        Sign out
      </button>
    </div>
  );
}

export default function Home() {
  const [tab, setTab] = useState<"tracker" | "stats" | "editor">("tracker");
  const { theme, toggleTheme } = useTheme();

  // Keyboard shortcuts: 1 → Tracker tab, 2 → Stats tab, 3 → Editor tab
  useKeyboardShortcuts({
    "1": () => setTab("tracker"),
    "2": () => setTab("stats"),
    "3": () => setTab("editor"),
  });

  return (
    <AuthGate>
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12 text-zinc-900 dark:text-zinc-100">
      <div className="w-full max-w-6xl">
        <UserBar />
        <div className="flex mb-0 w-full">
          <button
            className={`w-1/3 px-6 py-2 rounded-t-2xl font-medium text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900
              ${tab === "tracker" ? "bg-white dark:bg-zinc-900 border-x border-t border-zinc-200 dark:border-zinc-800 text-emerald-500 dark:text-emerald-400 shadow-lg shadow-black/10 dark:shadow-black/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400"}`}
            onClick={() => setTab("tracker")}
          >
            Time Tracker
          </button>
          <button
            className={`w-1/3 px-6 py-2 rounded-t-2xl font-medium text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900
              ${tab === "stats" ? "bg-white dark:bg-zinc-900 border-x border-t border-zinc-200 dark:border-zinc-800 text-emerald-500 dark:text-emerald-400 shadow-lg shadow-black/10 dark:shadow-black/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400"}`}
            onClick={() => setTab("stats")}
          >
            Statistics
          </button>
          <button
            className={`w-1/3 px-6 py-2 rounded-t-2xl font-medium text-sm transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-zinc-900
              ${tab === "editor" ? "bg-white dark:bg-zinc-900 border-x border-t border-zinc-200 dark:border-zinc-800 text-emerald-500 dark:text-emerald-400 shadow-lg shadow-black/10 dark:shadow-black/20" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400"}`}
            onClick={() => setTab("editor")}
          >
            Editor
          </button>
        </div>
        <div className="rounded-b-2xl border-x border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 p-8">
          {tab === "tracker" ? (
            <TimeTracker theme={theme} toggleTheme={toggleTheme} />
          ) : tab === "stats" ? (
            <div className="space-y-6">
              <header className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Statistics</h1>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">View your tracked time by day, week, or month.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  aria-label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  title={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                >
                  {theme === 'dark' ? '🌙 Dark mode' : '☀ Light mode'}
                </button>
              </header>
              <StatsView />
            </div>
          ) : (
            <div className="space-y-6">
              <header className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl font-semibold tracking-tight">Editor</h1>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">Browse, edit, and delete all your time entries.</p>
                </div>
                <button
                  onClick={toggleTheme}
                  className="rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  aria-label={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                  title={theme === 'dark' ? 'Dark mode' : 'Light mode'}
                >
                  {theme === 'dark' ? '🌙 Dark mode' : '☀ Light mode'}
                </button>
              </header>
              <EditorView />
            </div>
          )}
        </div>
      </div>
    </div>
    </AuthGate>
  );
}
