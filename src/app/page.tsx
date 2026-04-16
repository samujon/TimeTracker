"use client";
import { useState } from "react";
import { TimeTracker } from "@/views/TimeTracker";
import { StatsView } from "@/views/StatsView";
import { EditorView } from "@/views/EditorView";
import { useTheme } from "@/hooks/useTheme";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { AuthGate } from "@/components/AuthGate";
import { AppShell, type ActiveView } from "@/components/layout/AppShell";

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("tracker");
  const { theme, toggleTheme } = useTheme();

  useKeyboardShortcuts({
    "1": () => setActiveView("tracker"),
    "2": () => setActiveView("stats"),
    "3": () => setActiveView("editor"),
  });

  return (
    <AuthGate>
      <AppShell
        activeView={activeView}
        setActiveView={setActiveView}
        theme={theme}
        toggleTheme={toggleTheme}
      >
        {activeView === "tracker" && <TimeTracker />}
        {activeView === "stats" && <StatsView />}
        {activeView === "editor" && <EditorView />}
      </AppShell>
    </AuthGate>
  );
}
