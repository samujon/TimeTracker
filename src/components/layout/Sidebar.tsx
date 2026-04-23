"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { Clock, BarChart3, Table2, PanelLeftClose, PanelLeft, Sun, Moon, LogOut, FileText } from "lucide-react";
import { useUser } from "@/context/UserContext";
import type { ActiveView } from "./AppShell";
import type { Theme } from "@/hooks/useTheme";

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  collapsed: boolean;
  toggleCollapsed: () => void;
  theme: Theme;
  toggleTheme: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

const navItems: { id: ActiveView; label: string; icon: typeof Clock }[] = [
  { id: "tracker", label: "Timer", icon: Clock },
  { id: "stats", label: "Statistics", icon: BarChart3 },
  { id: "editor", label: "Editor", icon: Table2 },
];

export function Sidebar({
  activeView,
  setActiveView,
  collapsed,
  toggleCollapsed,
  theme,
  toggleTheme,
  mobileOpen,
  onMobileClose,
}: SidebarProps) {
  const { user, signOut } = useUser();

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo / Brand */}
      <div className={cn(
        "flex h-[var(--header-height)] items-center border-b border-[var(--color-border)] px-4",
        collapsed && "justify-center px-0"
      )}>
        {!collapsed && (
          <span className="text-sm font-semibold tracking-tight text-[var(--color-text)]">
            TimeTracker
          </span>
        )}
        {collapsed && (
          <Clock className="h-5 w-5 text-[var(--color-primary)]" />
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-1">
        {navItems.map((item) => {
          const active = activeView === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-ring",
                active
                  ? "bg-[var(--color-primary-light)] text-[var(--color-primary)]"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)]",
                collapsed && "justify-center px-0"
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--color-border)] p-2 space-y-1">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors focus-ring",
            collapsed && "justify-center px-0"
          )}
          title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {!collapsed && <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>}
        </button>

        <Link
          href="/storage"
          onClick={onMobileClose}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors focus-ring",
            collapsed && "justify-center px-0"
          )}
          title="Storage notice"
        >
          <FileText className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>Storage notice</span>}
        </Link>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={toggleCollapsed}
          className={cn(
            "hidden lg:flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors focus-ring",
            collapsed && "justify-center px-0"
          )}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          {!collapsed && <span>Collapse</span>}
        </button>

        {/* User info + sign out */}
        {!collapsed && user && (
          <div className="flex items-center gap-2 rounded-lg px-3 py-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-primary)] text-[10px] font-semibold text-[var(--color-primary-foreground)]">
              {(user.email?.[0] ?? "U").toUpperCase()}
            </div>
            <span className="flex-1 truncate text-xs text-[var(--color-text-secondary)]">
              {user.email}
            </span>
            <button
              onClick={signOut}
              className="rounded p-1 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)] transition-colors focus-ring"
              title="Sign out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
        {collapsed && user && (
          <button
            onClick={signOut}
            className="flex w-full items-center justify-center rounded-lg px-3 py-2 text-[var(--color-text-muted)] hover:text-[var(--color-destructive)] transition-colors focus-ring"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200",
          collapsed ? "w-[var(--sidebar-width-collapsed)]" : "w-[var(--sidebar-width)]"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile sidebar (slide-in) */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[var(--sidebar-width)] border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
