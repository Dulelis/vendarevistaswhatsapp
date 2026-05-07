import { mockPedidos } from "./mock-data";
import { createSupabaseServerClient } from "./supabase/server";
import type { Pedido, PedidoItem, StatusPedido } from "./types";

type PedidoRow = {
  id: string;
  codigo: string;
  vendedora_id: string;
  data_pedido: string;
  status: StatusPedido;
  valor_total: number | string;
  comissao_calculada: number | string;
  observacoes: string | null;
  vendedoras:
    | {
        nome: string;
      }
    | {
        nome: string;
      }[]
    | null;
  itens_pedido:
    | {
        id: string;
        produto_id: string;
        quantidade: number;
        preco_unitario: number | string;
        percentual_comissao: number | string;
        produtos:
          | {
              nome: string;
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
            }
          | {
              nome: string;
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
            }[]
          | null;
      }[]
    | null;
};

type ProdutoBaseRow = {
  id: string;
  nome: string;
  preco_catalogo: number | string;
  margem_comissao: number | string | null;
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

type VendedoraBaseRow = {
  id: string;
  nome: string;
  percentual_comissao: number | string;
};

export type PedidoDraftItemInput = {
  produtoId: string;
  quantidade: number;
};

export type CreatePedidoInput = {
  vendedoraId: string;
  status: StatusPedido;
  observacoes: string;
  itens: PedidoDraftItemInput[];
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

function getSingle<T>(value: T | T[] | null | undefined) {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? value[0] ?? null : value;
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
    | null
) {
  const revista = getSingle(revistas);

  return revista ? `${revista.titulo} ${revista.edicao}` : "Revista";
}

function mapPedidoItem(row: NonNullable<PedidoRow["itens_pedido"]>[number]): PedidoItem {
  const produto = getSingle(row.produtos);

  return {
    id: row.id,
    produtoId: row.produto_id,
    produtoNome: produto?.nome ?? "Produto",
    revistaTitulo: getRevistaLabel(produto?.revistas ?? null),
    quantidade: row.quantidade,
    precoUnitario: toNumber(row.preco_unitario),
    percentualComissao: toNumber(row.percentual_comissao),
  };
}

function mapPedido(row: PedidoRow): Pedido {
  const vendedora = getSingle(row.vendedoras);
  const itens = (row.itens_pedido ?? []).map(mapPedidoItem);

  return {
    id: row.id,
    codigo: row.codigo,
    vendedoraId: row.vendedora_id,
    vendedoraNome: vendedora?.nome ?? "Vendedora",
    status: row.status,
    criadoEm: row.data_pedido,
    valorTotal: toNumber(row.valor_total),
    comissaoCalculada: toNumber(row.comissao_calculada),
    itens,
    observacoes: row.observacoes ?? "",
  };
}

function buildPedidoCode() {
  const now = new Date();
  const stamp = [
    now.getFullYear().toString().slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");

  return `PED-${stamp}`;
}

export function isPedidosServerConfigured() {
  return createSupabaseServerClient() !== null;
}

export async function listPedidos() {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    return mockPedidos;
  }

  const { data, error } = await supabase
    .from("pedidos")
    .select(
      "id, codigo, vendedora_id, data_pedido, status, valor_total, comissao_calculada, observacoes, vendedoras(nome), itens_pedido(id, produto_id, quantidade, preco_unitario, percentual_comissao, produtos(nome, revistas(titulo, edicao)))",
    )
    .order("data_pedido", { ascending: false });

  if (error) {
    throw new Error(`Falha ao buscar pedidos: ${error.message}`);
  }

  return ((data ?? []) as PedidoRow[]).map(mapPedido);
}

async function loadPedidoContext(input: CreatePedidoInput) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const produtoIds = [...new Set(input.itens.map((item) => item.produtoId))];

  const [{ data: produtos, error: produtosError }, { data: vendedora, error: vendedoraError }] =
    await Promise.all([
      supabase
        .from("produtos")
        .select("id, nome, preco_catalogo, margem_comissao, revistas(titulo, edicao)")
        .in("id", produtoIds),
      supabase
        .from("vendedoras")
        .select("id, nome, percentual_comissao")
        .eq("id", input.vendedoraId)
        .single(),
    ]);

  if (produtosError) {
    throw new Error(`Falha ao buscar produtos do pedido: ${produtosError.message}`);
  }

  if (vendedoraError || !vendedora) {
    throw new Error("Nao consegui localizar a vendedora do pedido.");
  }

  return {
    supabase,
    produtos: (produtos ?? []) as ProdutoBaseRow[],
    vendedora: vendedora as VendedoraBaseRow,
  };
}

export async function createPedido(input: CreatePedidoInput) {
  const { supabase, produtos, vendedora } = await loadPedidoContext(input);

  const produtosMap = new Map(produtos.map((produto) => [produto.id, produto]));
  const fallbackPercentual = toNumber(vendedora.percentual_comissao);
  const codigo = buildPedidoCode();
  const itensCalculados = input.itens.map((item) => {
    const produto = produtosMap.get(item.produtoId);

    if (!produto) {
      throw new Error("Um dos produtos selecionados nao foi encontrado.");
    }

    const precoUnitario = toNumber(produto.preco_catalogo);
    const percentualComissao =
      produto.margem_comissao === null
        ? fallbackPercentual
        : toNumber(produto.margem_comissao);

    return {
      produto,
      produto_id: item.produtoId,
      quantidade: item.quantidade,
      preco_unitario: precoUnitario,
      percentual_comissao: percentualComissao,
      subtotal: precoUnitario * item.quantidade,
      subtotalComissao:
        precoUnitario * item.quantidade * (percentualComissao / 100),
    };
  });

  const valorTotal = itensCalculados.reduce((sum, item) => sum + item.subtotal, 0);
  const comissaoCalculada = itensCalculados.reduce(
    (sum, item) => sum + item.subtotalComissao,
    0,
  );

  const { data: pedido, error: pedidoError } = await supabase
    .from("pedidos")
    .insert({
      codigo,
      vendedora_id: input.vendedoraId,
      status: input.status,
      valor_total: Number(valorTotal.toFixed(2)),
      comissao_calculada: Number(comissaoCalculada.toFixed(2)),
      observacoes: input.observacoes || null,
    })
    .select("id, codigo, data_pedido")
    .single();

  if (pedidoError || !pedido) {
    throw new Error(`Falha ao criar pedido: ${pedidoError?.message ?? "sem retorno"}`);
  }

  const { error: itensError } = await supabase.from("itens_pedido").insert(
    itensCalculados.map((item) => ({
      pedido_id: pedido.id,
      produto_id: item.produto_id,
      quantidade: item.quantidade,
      preco_unitario: Number(item.preco_unitario.toFixed(2)),
      percentual_comissao: Number(item.percentual_comissao.toFixed(2)),
    })),
  );

  if (itensError) {
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    throw new Error(`Falha ao criar itens do pedido: ${itensError.message}`);
  }

  return {
    id: pedido.id,
    codigo: pedido.codigo,
    vendedoraId: input.vendedoraId,
    vendedoraNome: vendedora.nome,
    status: input.status,
    criadoEm: pedido.data_pedido,
    valorTotal: Number(valorTotal.toFixed(2)),
    comissaoCalculada: Number(comissaoCalculada.toFixed(2)),
    observacoes: input.observacoes || "",
    itens: itensCalculados.map((item, index) => ({
      id: `${pedido.id}-${index + 1}`,
      produtoId: item.produto_id,
      produtoNome: item.produto.nome,
      revistaTitulo: getRevistaLabel(item.produto.revistas),
      quantidade: item.quantidade,
      precoUnitario: Number(item.preco_unitario.toFixed(2)),
      percentualComissao: Number(item.percentual_comissao.toFixed(2)),
    })),
  };
}

export async function updatePedidoStatus(id: string, status: StatusPedido) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const { error } = await supabase.from("pedidos").update({ status }).eq("id", id);

  if (error) {
    throw new Error(`Falha ao atualizar status do pedido: ${error.message}`);
  }
}

export async function deletePedido(id: string) {
  const supabase = createSupabaseServerClient();

  if (!supabase) {
    throw new Error("Supabase nao configurado no servidor.");
  }

  const { error } = await supabase.from("pedidos").delete().eq("id", id);

  if (error) {
    throw new Error(`Falha ao remover pedido: ${error.message}`);
  }
}
