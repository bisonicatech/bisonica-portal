import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS entirely. Server-only: SUPABASE_SERVICE_ROLE_KEY
// must never reach the browser bundle (no NEXT_PUBLIC_ prefix, never imported by a
// "use client" module).
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
