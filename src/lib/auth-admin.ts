import { redirect } from "next/navigation";
import { createSupabaseAuthServerClient } from "./supabase/auth-server";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isLocalAdminBypassEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.DEV_ADMIN_BYPASS === "true"
  );
}

export function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);
}

export function isAdminProtectionEnabled() {
  return getAdminEmails().length > 0;
}

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  return getAdminEmails().includes(normalizeEmail(email));
}

export async function getAuthenticatedAdmin() {
  const supabase = await createSupabaseAuthServerClient();
  const localBypassEnabled = isLocalAdminBypassEnabled();

  if (!supabase) {
    return {
      user: null,
      isAdmin: localBypassEnabled,
      localBypassEnabled,
      protectionEnabled: isAdminProtectionEnabled(),
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return {
    user,
    isAdmin: localBypassEnabled || isAdminEmail(user?.email),
    localBypassEnabled,
    protectionEnabled: isAdminProtectionEnabled(),
  };
}

export async function requireAdminUser() {
  const result = await getAuthenticatedAdmin();

  if (result.localBypassEnabled) {
    return result;
  }

  if (!result.protectionEnabled) {
    return result;
  }

  if (!result.user || !result.isAdmin) {
    redirect("/login-admin?erro=sem-acesso");
  }

  return result;
}

export async function assertAdminActionAccess() {
  const result = await getAuthenticatedAdmin();

  if (result.localBypassEnabled) {
    return result;
  }

  if (!result.protectionEnabled) {
    return result;
  }

  if (!result.user || !result.isAdmin) {
    throw new Error("Apenas administradores podem executar essa acao.");
  }

  return result;
}
