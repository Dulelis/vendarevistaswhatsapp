"use server";

import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";

export async function logoutAdminAction() {
  const supabase = await createSupabaseAuthServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login-admin");
}
