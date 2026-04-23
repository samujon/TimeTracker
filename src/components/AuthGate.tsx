"use client";

import Link from "next/link";
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
    // Initial auth check — getUser() validates the JWT with the Supabase
    // server rather than trusting the local storage value (as getSession() does).
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user ?? null);
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
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)]">
        <div className="h-7 w-7 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-bg)] px-4 py-12">
        <div className="w-full max-w-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 shadow-lg">
          <h1 className="mb-6 text-center text-xl font-semibold tracking-tight text-[var(--color-text)]">
            Time Tracker
          </h1>
          <Auth
            supabaseClient={supabase}
            providers={["google"]}
            queryParams={{ prompt: "select_account" }}
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
                    brand: "#4f46e5",
                    brandAccent: "#4338ca",
                  },
                },
              },
            }}
          />
          <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
            Supabase auth cookies are used only for sign-in and session handling. Read the{" "}
            <Link href="/storage" className="underline underline-offset-4 hover:text-[var(--color-text)]">
              storage notice
            </Link>
            .
          </p>
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
