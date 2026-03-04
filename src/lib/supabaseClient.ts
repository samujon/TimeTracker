"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const hasSupabaseEnv = Boolean(supabaseUrl && supabaseAnonKey);

let supabase: SupabaseClient | null = null;

if (hasSupabaseEnv) {
  supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);
}

export function getSupabaseClient(): SupabaseClient | null {
  return supabase;
}

