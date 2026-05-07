"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { assertVendedoraActionAccess } from "@/lib/auth-vendedora";
import { getDashboardSnapshot, getWhatsAppDestination } from "@/lib/data";
import {
  filterProdutosDisponiveisParaVendedora,
  buildPortalVendedoraData,
} from "@/lib/portal-vendedora";
import {
  createPedido,
  isPedidosServerConfigured,
  type PedidoDraftItemInput,
} from "@/lib/pedidos";
import { createSupabaseAuthServerClient } from "@/lib/supabase/auth-server";
import {
  buildPedidoObservacoesText,
  buildWhatsAppOrderLink,
} from "@/lib/whatsapp";

type MinhaAreaPedidoInput = {
  clienteNome: string;
  observacoes: string;
  itens: PedidoDraftItemInput[];
};

type MinhaAreaPedidoActionResult = {
  ok: boolean;
  message: string;
  whatsappLink?: string;
};

function revalidatePedidoViews() {
  revalidatePath("/");
  revalidatePath("/minha-area");
  revalidatePath("/vendedora");
  revalidatePath("/pedidos");
  revalidatePath("/vendedoras");
  revalidatePath("/financeiro");
  revalidatePath("/relatorios");
}

function sanitizeMinhaAreaPedidoInput(input: MinhaAreaPedidoInput) {
  const itens = input.itens
    .map((item) => ({
      produtoId: item.produtoId,
      quantidade: Math.trunc(Number(item.quantidade)),
    }))
    .filter((item) => item.produtoId && Number.isFinite(item.quantidade));

  if (!itens.length || itens.every((item) => item.quantidade <= 0)) {
    throw new Error("Adicione pelo menos um item valido ao pedido.");
  }

  return {
    clienteNome: input.clienteNome.trim(),
    observacoes: input.observacoes.trim(),
    itens: itens.filter((item) => item.quantidade > 0),
  };
}

export async function createMinhaAreaPedidoAction(
  rawInput: MinhaAreaPedidoInput,
): Promise<MinhaAreaPedidoActionResult> {
  if (!isPedidosServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para registrar pedidos.",
    };
  }

  try {
    const {
      vendedora,
    } = await assertVendedoraActionAccess();

    if (!vendedora) {
      throw new Error("Sua sessao de vendedora expirou. Entre novamente.");
    }

    const input = sanitizeMinhaAreaPedidoInput(rawInput);
    const snapshot = await getDashboardSnapshot();
    const portal = buildPortalVendedoraData(
      snapshot.vendedoras,
      snapshot.revistas,
      snapshot.pedidos,
      vendedora.id,
    );

    if (!portal.selecionada) {
      throw new Error("Nao consegui validar a vendedora deste pedido.");
    }

    const produtosDisponiveis = filterProdutosDisponiveisParaVendedora(
      snapshot.produtos,
      portal.revistas,
    );
    const produtosDisponiveisIds = new Set(
      produtosDisponiveis.map((produto) => produto.id),
    );

    if (input.itens.some((item) => !produtosDisponiveisIds.has(item.produtoId))) {
      throw new Error("Um dos produtos selecionados nao esta liberado para a sua area.");
    }

    const pedido = await createPedido({
      vendedoraId: vendedora.id,
      status: "pendente",
      observacoes: buildPedidoObservacoesText(
        input.clienteNome,
        input.observacoes,
      ),
      itens: input.itens,
    });

    revalidatePedidoViews();

    return {
      ok: true,
      message: `Pedido ${pedido.codigo} registrado e pronto para envio.`,
      whatsappLink: buildWhatsAppOrderLink(pedido, getWhatsAppDestination()),
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui registrar o pedido.",
    };
  }
}

export async function logoutVendedoraAction() {
  const supabase = await createSupabaseAuthServerClient();

  if (supabase) {
    await supabase.auth.signOut();
  }

  redirect("/login-vendedora");
}
