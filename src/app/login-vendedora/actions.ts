"use server";

import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import { getAppBaseUrl } from "@/lib/auth-vendedora";
import { findVendedoraByEmail } from "@/lib/vendedoras";

type ActionResult = {
  ok: boolean;
  message: string;
};

export async function sendVendedoraMagicLinkAction(
  formData: FormData,
): Promise<ActionResult> {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  if (!email) {
    return {
      ok: false,
      message: "Informe o email de acesso da vendedora.",
    };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      ok: false,
      message: "Informe um email valido.",
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

  const vendedora = await findVendedoraByEmail(email);

  if (!vendedora || !vendedora.ativa) {
    return {
      ok: false,
      message:
        "Esse email ainda nao esta liberado para a area da vendedora.",
    };
  }

  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${getAppBaseUrl()}/auth/confirm?next=/minha-area`,
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
    message: `Enviei o link de acesso para ${email}.`,
  };
}
