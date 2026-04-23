"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { cn } from "@/lib/utils";
import type { Theme } from "@/hooks/useTheme";

export type ActiveView = "tracker" | "stats" | "editor";

interface AppShellProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  theme: Theme;
  toggleTheme: () => void;
  children: React.ReactNode;
}

export function AppShell({ activeView, setActiveView, theme, toggleTheme, children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleCollapsed = () => {
    setCollapsed((prev) => !prev);
  };

  const viewTitles: Record<ActiveView, string> = {
    tracker: "Time Tracker",
    stats: "Statistics",
    editor: "Editor",
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg)]">
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={(v: ActiveView) => {
          setActiveView(v);
          setMobileOpen(false);
        }}
        collapsed={collapsed}
        toggleCollapsed={toggleCollapsed}
        theme={theme}
        toggleTheme={toggleTheme}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header
          title={viewTitles[activeView]}
          onMenuClick={() => setMobileOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
