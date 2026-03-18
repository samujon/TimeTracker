"use client";

import { useUser } from "@/context/UserContext";

/**
 * Displays the signed-in user's email and a sign-out button.
 * Rendered above the tab bar on every page.
 */
export function UserBar() {
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
