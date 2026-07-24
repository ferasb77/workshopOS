import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { requireEnv } from "@/infrastructure/env";

function instantiateClient() {
  return createSupabaseClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false } }
  );
}

let client: ReturnType<typeof instantiateClient> | null = null;

/**
 * Bypasses RLS entirely. Only for trusted server-only infrastructure that
 * has no user session to scope to — today that's Supabase Storage
 * operations for certificate PDFs (a bucket with no row-level policies of
 * its own) and the certificate-issuing Server Action, which must also work
 * from the public check-in/survey-submission flows where there's no
 * authenticated session to bind to. Every caller must already be behind an
 * authenticated Server Action or one of those specific public,
 * already-validated entry points — never import this into a data-fetching
 * function that's reachable without that check.
 */
export function createServiceRoleClient() {
  if (!client) {
    client = instantiateClient();
  }

  return client;
}
