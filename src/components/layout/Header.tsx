"use client";

import { Menu } from "lucide-react";

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
}

export function Header({ title, onMenuClick, actions }: HeaderProps) {
  return (
    <header className="flex h-[var(--header-height)] items-center gap-4 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-4 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-alt)] hover:text-[var(--color-text)] transition-colors lg:hidden focus-ring"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <h1 className="text-sm font-semibold text-[var(--color-text)]">{title}</h1>
      {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
    </header>
  );
}
