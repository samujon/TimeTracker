"use client";

import { createContext, useContext } from "react";
import type { User } from "@supabase/supabase-js";

interface UserContextValue {
  user: User | null;
  signOut: () => Promise<void>;
}

export const UserContext = createContext<UserContextValue>({
  user: null,
  signOut: async () => {},
});

/** Access the authenticated user and signOut helper from any client component. */
export function useUser(): UserContextValue {
  return useContext(UserContext);
}
