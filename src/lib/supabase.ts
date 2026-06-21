// Supabase client singleton: lazily creates a persisted-session client from env vars and gates the app when they're missing.
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

/** True when both the Supabase URL and anon key env vars are present. */
export function isSupabaseConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

/** Returns the lazily-created, memoized Supabase client; throws if env vars are missing. */
export function getSupabaseClient() {
  if (!isSupabaseConfigured()) {
    throw new Error("Missing Supabase environment variables.");
  }

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        // Keep the user signed in across reloads/visits and auto-refresh the token.
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: "vengryd-auth",
      },
    });
  }

  return supabaseClient;
}
