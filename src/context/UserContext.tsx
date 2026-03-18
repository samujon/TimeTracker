"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

interface UserContextValue {
  user: User | null;
  signOut: () => Promise<void>;
}

// Sentinel: null means the context has never been provided (hook used outside AuthGate).
const UserContext = createContext<UserContextValue | null>(null);

export { UserContext };

/**
 * Access the authenticated user and signOut helper from any client component.
 * Must be called within a component tree wrapped by <AuthGate>.
 */
export function useUser(): UserContextValue {
  const ctx = useContext(UserContext);
  if (ctx === null) {
    throw new Error(
      "useUser() was called outside of <AuthGate>. " +
      "Wrap the component tree with <AuthGate> to provide UserContext."
    );
  }
  return ctx;
}
