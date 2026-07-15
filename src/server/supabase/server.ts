import "server-only"; // build-time guard: this file must never be imported by client code

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** True only when real Supabase credentials are present in .env. */
export function isSupabaseConfigured(): boolean {
  return Boolean(url && serviceKey);
}

let cached: SupabaseClient | null = null;

/**
 * Server-only Supabase client. Uses the service-role key (bypasses RLS), so it
 * must NEVER be imported from a client component. All DB access goes through
 * the service layer in src/server/services.
 */
export function getServerSupabase(): SupabaseClient {
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env."
    );
  }
  if (!cached) {
    cached = createClient(url, serviceKey, { auth: { persistSession: false } });
  }
  return cached;
}
