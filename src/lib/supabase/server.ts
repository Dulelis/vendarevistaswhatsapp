import { createClient } from "@supabase/supabase-js";

export function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !serverKey) {
    return null;
  }

  return createClient(url, serverKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
