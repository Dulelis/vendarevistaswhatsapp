import { createSupabaseServerClient } from "./supabase/server";
import { mockVendedoras } from "./mock-data";
import type { Vendedora } from "./types";

type VendedoraRow = {
  id: string;
  nome: string;
  email: string | null;
  auth_user_id: string | null;
  whatsapp: string;
  telefone: string | null;
  percentual_comissao: number | string;
  cidade: string | null;
  ativa: boolean;
  observacoes: string | null;
  created_at: string;
  updated_at: string;
  pedidos?:
    | {
        valor_total: number | string;
        status: string;
        data_pedido: string;
      }[]
    | null;
};

export type UpsertVendedoraInput = {
  id?: string;
  nome: string;
  email?: string;
  whatsapp: string;
  telefone: string;
  percentualComissao: number;
  cidade: string;
  observacoes: string;
  ativa: boolean;
};

function toNumber(value: number | string | null | undefined) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  return 0;
}

function getFallbackDate(row: VendedoraRow) {
  return row.updated_at || row.created_at || new Date().toISOString();
}

function mapSupabaseRowToVendedora(row: VendedoraRow): Vendedora {
  const pedidos = row.pedidos ?? [];
  const totalMes = pedidos.reduce(
    (sum, pedido) => sum + toNumber(pedido.valor_total),
    0,
  );
  const pedidosPendentes = pedidos.filter(
    (pedido) => pedido.status === "pendente" || pedido.status === "separacao",
  ).length;
  const ultimaVendaEm =
    pedidos
      .map((pedido) => pedido.data_pedido)
      .sort((left, right) => right.localeCompare(left))[0] ?? getFallbackDate(row);

  return {
    id: row.id,
    nome: row.nome,
    email: row.email ?? undefined,
    authUserId: row.auth_user_id ?? undefined,
    whatsapp: row.whatsapp,
    telefone: row.telefone ?? row.whatsapp,
    percentualComissao: toNumber(row.percentual_comissao),
    cidade: row.cidade ?? "Sem cidade definida",
    ativa: row.ativa,
    totalMes,
    pedidosPendentes,
    ultimaVendaEm,
    revistasAtivas: [],
    observacoes: row.observacoes ?? "",
  };
}

export function isSupabaseServerConfigured() {
  return createSupabaseServerClient() !== null;
}

export async function listVendedoras() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockVendedoras;
  }

  const { data, error } = await supabase
    .from("vendedoras")
    .select(
      "id, nome, email, auth_user_id, whatsapp, telefone, percentual_comissao, cidade, ativa, observacoes, created_at, updated_at, pedidos(valor_total, status, data_pedido)",
    )
    .order("ativa", { ascending: false })
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Falha ao buscar vendedoras no Supabase: ${error.message}`);
  }

  return ((data ?? []) as VendedoraRow[]).map(mapSupabaseRowToVendedora);
}

export async function upsertVendedora(input: UpsertVendedoraInput) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const payload = {
    nome: input.nome,
    email: input.email?.trim().toLowerCase() || null,
    whatsapp: input.whatsapp,
    telefone: input.telefone,
    percentual_comissao: input.percentualComissao,
    cidade: input.cidade,
    observacoes: input.observacoes || null,
    ativa: input.ativa,
  };

  if (input.id) {
    const { error } = await supabase
      .from("vendedoras")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(`Falha ao atualizar vendedora: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from("vendedoras").insert(payload);

  if (error) {
    throw new Error(`Falha ao criar vendedora: ${error.message}`);
  }
}

export async function findVendedoraByEmail(email: string) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return (
      mockVendedoras.find(
        (item) => item.email?.toLowerCase() === email.trim().toLowerCase(),
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from("vendedoras")
    .select(
      "id, nome, email, auth_user_id, whatsapp, telefone, percentual_comissao, cidade, ativa, observacoes, created_at, updated_at, pedidos(valor_total, status, data_pedido)",
    )
    .ilike("email", email.trim())
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao buscar acesso da vendedora: ${error.message}`);
  }

  return data ? mapSupabaseRowToVendedora(data as VendedoraRow) : null;
}

export async function findVendedoraByAuthUserId(authUserId: string) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockVendedoras.find((item) => item.authUserId === authUserId) ?? null;
  }

  const { data, error } = await supabase
    .from("vendedoras")
    .select(
      "id, nome, email, auth_user_id, whatsapp, telefone, percentual_comissao, cidade, ativa, observacoes, created_at, updated_at, pedidos(valor_total, status, data_pedido)",
    )
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (error) {
    throw new Error(
      `Falha ao buscar vendedora pelo usuario autenticado: ${error.message}`,
    );
  }

  return data ? mapSupabaseRowToVendedora(data as VendedoraRow) : null;
}

export async function linkVendedoraAuthUserByEmail(
  email: string,
  authUserId: string,
) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const { data: existing, error: existingError } = await supabase
    .from("vendedoras")
    .select("id, auth_user_id")
    .eq("auth_user_id", authUserId)
    .maybeSingle();

  if (existingError) {
    throw new Error(
      `Falha ao conferir usuario autenticado da vendedora: ${existingError.message}`,
    );
  }

  if (existing?.id) {
    return existing.id;
  }

  const { data, error } = await supabase
    .from("vendedoras")
    .update({ auth_user_id: authUserId })
    .ilike("email", email.trim())
    .is("auth_user_id", null)
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao vincular acesso da vendedora: ${error.message}`);
  }

  return data?.id ?? null;
}

export async function deleteVendedora(id: string) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const { error } = await supabase.from("vendedoras").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao remover vendedora: ${error.message}`);
  }
}
