import { mockProdutos, mockRevistas } from "./mock-data";
import { createSupabaseServerClient } from "./supabase/server";
import type { Produto, Revista } from "./types";

type RevistaRow = {
  id: string;
  titulo: string;
  edicao: string;
  vigencia_inicio: string;
  vigencia_fim: string;
  ativa: boolean;
  margem_padrao: number | string;
  catalogo_url: string | null;
  catalogo_nome_arquivo: string | null;
  texto_compartilhamento: string | null;
};

type ProdutoRow = {
  id: string;
  revista_id: string;
  codigo: string;
  nome: string;
  categoria: string | null;
  preco_catalogo: number | string;
  estoque_atual: number;
  margem_comissao: number | string | null;
  ativo: boolean;
  revistas:
    | {
        titulo: string;
        edicao: string;
      }
    | {
        titulo: string;
        edicao: string;
      }[]
    | null;
};

export type UpsertRevistaInput = {
  id?: string;
  titulo: string;
  edicao: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  margemPadrao: number;
  ativa: boolean;
  catalogoUrl?: string;
  catalogoNomeArquivo?: string;
  textoCompartilhamento?: string;
};

export type UpsertProdutoInput = {
  id?: string;
  revistaId: string;
  codigo: string;
  nome: string;
  categoria: string;
  precoCatalogo: number;
  estoqueAtual: number;
  margemComissao?: number;
  ativo: boolean;
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

function mapRevistaRow(row: RevistaRow): Revista {
  return {
    id: row.id,
    titulo: row.titulo,
    edicao: row.edicao,
    vigenciaInicio: row.vigencia_inicio,
    vigenciaFim: row.vigencia_fim,
    ativa: row.ativa,
    margemPadrao: toNumber(row.margem_padrao),
    catalogoUrl: row.catalogo_url ?? undefined,
    catalogoNomeArquivo: row.catalogo_nome_arquivo ?? undefined,
    textoCompartilhamento: row.texto_compartilhamento ?? undefined,
  };
}

function getRevistaLabel(
  revistas:
    | {
        titulo: string;
        edicao: string;
      }
    | {
        titulo: string;
        edicao: string;
      }[]
    | null,
) {
  if (!revistas) {
    return "Revista sem nome";
  }

  const revista = Array.isArray(revistas) ? revistas[0] : revistas;

  return revista ? `${revista.titulo} ${revista.edicao}` : "Revista sem nome";
}

function mapProdutoRow(row: ProdutoRow): Produto {
  return {
    id: row.id,
    revistaId: row.revista_id,
    revistaTitulo: getRevistaLabel(row.revistas),
    codigo: row.codigo,
    nome: row.nome,
    categoria: row.categoria ?? "Sem categoria",
    precoCatalogo: toNumber(row.preco_catalogo),
    estoqueAtual: row.estoque_atual,
    margemComissao:
      row.margem_comissao === null ? undefined : toNumber(row.margem_comissao),
    ativo: row.ativo,
  };
}

export function isCatalogoServerConfigured() {
  return createSupabaseServerClient() !== null;
}

export async function listRevistas() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockRevistas;
  }

  const { data, error } = await supabase
    .from("revistas")
    .select(
      "id, titulo, edicao, vigencia_inicio, vigencia_fim, ativa, margem_padrao, catalogo_url, catalogo_nome_arquivo, texto_compartilhamento",
    )
    .order("ativa", { ascending: false })
    .order("vigencia_fim", { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar revistas: ${error.message}`);
  }

  return ((data ?? []) as RevistaRow[]).map(mapRevistaRow);
}

export async function listProdutos() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockProdutos;
  }

  const { data, error } = await supabase
    .from("produtos")
    .select(
      "id, revista_id, codigo, nome, categoria, preco_catalogo, estoque_atual, margem_comissao, ativo, revistas(titulo, edicao)",
    )
    .order("ativo", { ascending: false })
    .order("nome", { ascending: true });

  if (error) {
    throw new Error(`Falha ao buscar produtos: ${error.message}`);
  }

  return ((data ?? []) as ProdutoRow[]).map(mapProdutoRow);
}

export async function upsertRevista(input: UpsertRevistaInput) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const payload = {
    titulo: input.titulo,
    edicao: input.edicao,
    vigencia_inicio: input.vigenciaInicio,
    vigencia_fim: input.vigenciaFim,
    margem_padrao: input.margemPadrao,
    ativa: input.ativa,
    catalogo_url: input.catalogoUrl || null,
    catalogo_nome_arquivo: input.catalogoNomeArquivo || null,
    texto_compartilhamento: input.textoCompartilhamento || null,
  };

  if (input.id) {
    const { error } = await supabase
      .from("revistas")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(`Falha ao atualizar revista: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from("revistas").insert(payload);

  if (error) {
    throw new Error(`Falha ao criar revista: ${error.message}`);
  }
}

export async function deleteRevista(id: string) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const { error } = await supabase.from("revistas").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao remover revista: ${error.message}`);
  }
}

export async function upsertProduto(input: UpsertProdutoInput) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const payload = {
    revista_id: input.revistaId,
    codigo: input.codigo,
    nome: input.nome,
    categoria: input.categoria,
    preco_catalogo: input.precoCatalogo,
    estoque_atual: input.estoqueAtual,
    margem_comissao: input.margemComissao ?? null,
    ativo: input.ativo,
  };

  if (input.id) {
    const { error } = await supabase
      .from("produtos")
      .update(payload)
      .eq("id", input.id);

    if (error) {
      throw new Error(`Falha ao atualizar produto: ${error.message}`);
    }

    return;
  }

  const { error } = await supabase.from("produtos").insert(payload);

  if (error) {
    throw new Error(`Falha ao criar produto: ${error.message}`);
  }
}

export async function deleteProduto(id: string) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const { error } = await supabase.from("produtos").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao remover produto: ${error.message}`);
  }
}
