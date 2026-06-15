import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Public Supabase client — uses the anon key.
 * Safe to import in client components.
 *
 * Returns null when env vars are missing so build does not break before
 * Supabase credentials are wired up. Sections that depend on Supabase
 * (reviews, contact form) should gracefully handle null.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false },
      })
    : null;
