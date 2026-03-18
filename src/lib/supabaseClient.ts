"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

// createBrowserClient automatically handles cookie-based session
// persistence, which is required for Supabase Auth in Next.js.
const supabase: SupabaseClient | null = hasSupabaseEnv
  ? createBrowserClient(supabaseUrl as string, supabaseAnonKey as string)
  : null;

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}
