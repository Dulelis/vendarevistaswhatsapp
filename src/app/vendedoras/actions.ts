"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionAccess } from "@/lib/auth-admin";
import {
  deleteVendedora,
  isSupabaseServerConfigured,
  upsertVendedora,
  type UpsertVendedoraInput,
} from "@/lib/vendedoras";

type ActionResult = {
  ok: boolean;
  message: string;
};

function validateInput(input: UpsertVendedoraInput) {
  const nome = input.nome.trim();
  const email = input.email?.trim().toLowerCase() || "";
  const whatsapp = input.whatsapp.trim();
  const telefone = input.telefone.trim() || whatsapp;
  const cidade = input.cidade.trim() || "Sem cidade definida";
  const observacoes = input.observacoes.trim();
  const percentualComissao = Number(input.percentualComissao);

  if (!nome || !whatsapp) {
    throw new Error("Preencha ao menos nome e WhatsApp da vendedora.");
  }

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Informe um email valido para o acesso da vendedora.");
  }

  if (Number.isNaN(percentualComissao) || percentualComissao <= 0) {
    throw new Error("Informe um percentual de comissao valido.");
  }

  return {
    ...input,
    nome,
    email,
    whatsapp,
    telefone,
    cidade,
    observacoes,
    percentualComissao,
  };
}

function revalidateVendedorasViews() {
  revalidatePath("/");
  revalidatePath("/vendedoras");
  revalidatePath("/vendedora");
  revalidatePath("/minha-area");
}

export async function saveVendedoraAction(
  rawInput: UpsertVendedoraInput,
): Promise<ActionResult> {
  if (!isSupabaseServerConfigured()) {
    return {
      ok: false,
      message:
        "Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para gravar no Supabase.",
    };
  }

  try {
    await assertAdminActionAccess();
    const input = validateInput(rawInput);

    await upsertVendedora(input);
    revalidateVendedorasViews();

    return {
      ok: true,
      message: input.id
        ? `${input.nome} foi atualizada no Supabase.`
        : `${input.nome} foi salva no Supabase.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui salvar a vendedora no Supabase.",
    };
  }
}

export async function deleteVendedoraAction(id: string): Promise<ActionResult> {
  if (!isSupabaseServerConfigured()) {
    return {
      ok: false,
      message:
        "Preencha NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY para remover no Supabase.",
    };
  }

  try {
    await assertAdminActionAccess();
    await deleteVendedora(id);
    revalidateVendedorasViews();

    return {
      ok: true,
      message: "Cadastro removido do Supabase.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui remover a vendedora no Supabase.",
    };
  }
}
