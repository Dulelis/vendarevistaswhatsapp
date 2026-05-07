"use server";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  getAdminEmails,
  isAdminEmail,
  isAdminProtectionEnabled,
} from "@/lib/auth-admin";
import { getAppBaseUrl } from "@/lib/auth-vendedora";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function sendAdminMagicLinkAction(
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!isAdminProtectionEnabled()) {
    return {
      ok: false,
      message:
        "Defina ADMIN_EMAILS no ambiente para ativar o acesso protegido do admin.",
    };
  }

  if (!email) {
    return {
      ok: false,
      message: "Informe o email de acesso do admin.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      message: "Informe um email valido.",
    };
  }

  if (!isAdminEmail(email)) {
    return {
      ok: false,
      message: `Esse email nao esta na lista de admin. Hoje os emails liberados sao: ${getAdminEmails().join(", ")}`,
    };
  }

  const supabase = await createSupabaseAuthServerClient();

  if (!supabase) {
    return {
      ok: false,
      message:
        "Nao encontrei a configuracao publica do Supabase para enviar o acesso.",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getAppBaseUrl()}/auth/confirm?next=/`,
      shouldCreateUser: true,
    },
  });

  if (error) {
    return {
      ok: false,
      message: `Nao consegui enviar o link de acesso: ${error.message}`,
    };
  }

  return {
    ok: true,
    message: `Enviei o link de acesso do admin para ${email}.`,
  };
}
