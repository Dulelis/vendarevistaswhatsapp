"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionAccess } from "@/lib/auth-admin";
import {
  createPedido,
  deletePedido,
  isPedidosServerConfigured,
  updatePedidoStatus,
  type CreatePedidoInput,
} from "@/lib/pedidos";
import type { StatusPedido } from "@/lib/types";

type ActionResult = {
  ok: boolean;
  message: string;
};

function revalidatePedidoViews() {
  revalidatePath("/");
  revalidatePath("/pedidos");
  revalidatePath("/vendedoras");
}

function validatePedidoInput(input: CreatePedidoInput) {
  const itens = input.itens.filter(
    (item) => item.produtoId && Number(item.quantidade) > 0,
  );

  if (!input.vendedoraId) {
    throw new Error("Selecione a vendedora do pedido.");
  }

  if (!itens.length) {
    throw new Error("Adicione pelo menos um item ao pedido.");
  }

  return {
    ...input,
    observacoes: input.observacoes.trim(),
    itens,
  };
}

export async function createPedidoAction(
  rawInput: CreatePedidoInput,
): Promise<ActionResult> {
  if (!isPedidosServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para criar pedidos.",
    };
  }

  try {
    await assertAdminActionAccess();
    const input = validatePedidoInput(rawInput);
    await createPedido(input);
    revalidatePedidoViews();

    return {
      ok: true,
      message: "Pedido criado com sucesso.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error ? error.message : "Nao consegui criar o pedido.",
    };
  }
}

export async function updatePedidoStatusAction(
  id: string,
  status: StatusPedido,
): Promise<ActionResult> {
  if (!isPedidosServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para atualizar pedidos.",
    };
  }

  try {
    await assertAdminActionAccess();
    await updatePedidoStatus(id, status);
    revalidatePedidoViews();

    return {
      ok: true,
      message: `Status do pedido atualizado para ${status}.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui atualizar o status do pedido.",
    };
  }
}

export async function removePedidoAction(id: string): Promise<ActionResult> {
  if (!isPedidosServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para remover pedidos.",
    };
  }

  try {
    await assertAdminActionAccess();
    await deletePedido(id);
    revalidatePedidoViews();

    return {
      ok: true,
      message: "Pedido removido com sucesso.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui remover o pedido.",
    };
  }
}
