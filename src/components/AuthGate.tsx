"use client";

import { useEffect, useState } from "react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import type { User } from "@supabase/supabase-js";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { UserContext } from "@/context/UserContext";

/**
 * AuthGate wraps the entire app and ensures only authenticated users
 * can see their data. Unauthenticated visitors see the sign-in form.
 *
 * It also provides UserContext so any child component can read the
 * current user without prop-drilling.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const supabase = getSupabaseClient()!;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initial session check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // React to sign-in / sign-out events in real time
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    // Minimal spinner while we verify the session — avoids layout flash
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-300 border-t-emerald-500 dark:border-zinc-700 dark:border-t-emerald-400" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 py-12">
        <div className="w-full max-w-sm rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8 shadow-lg shadow-black/5 dark:shadow-black/20">
          <h1 className="mb-6 text-center text-xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Time Tracker
          </h1>
          <Auth
            supabaseClient={supabase}
            providers={["google"]}
            redirectTo={
              typeof window !== "undefined"
                ? `${window.location.origin}/auth/callback`
                : undefined
            }
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: "#10b981",
                    brandAccent: "#059669",
                  },
                },
              },
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <UserContext.Provider value={{ user, signOut }}>
      {children}
    </UserContext.Provider>
  );
}
