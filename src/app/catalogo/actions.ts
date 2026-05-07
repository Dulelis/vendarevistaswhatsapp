"use server";

import { revalidatePath } from "next/cache";
import { assertAdminActionAccess } from "@/lib/auth-admin";
import {
  deleteProduto,
  deleteRevista,
  isCatalogoServerConfigured,
  upsertProduto,
  upsertRevista,
  type UpsertProdutoInput,
  type UpsertRevistaInput,
} from "@/lib/catalogo";

type ActionResult = {
  ok: boolean;
  message: string;
};

function revalidateCatalogoViews() {
  revalidatePath("/");
  revalidatePath("/catalogo");
}

function validateRevistaInput(input: UpsertRevistaInput) {
  const titulo = input.titulo.trim();
  const edicao = input.edicao.trim();
  const textoCompartilhamento = input.textoCompartilhamento?.trim() || "";

  if (!titulo || !edicao || !input.vigenciaInicio || !input.vigenciaFim) {
    throw new Error("Preencha titulo, edicao e vigencia da revista.");
  }

  if (Number.isNaN(input.margemPadrao) || input.margemPadrao <= 0) {
    throw new Error("Informe uma margem padrao valida.");
  }

  return {
    ...input,
    titulo,
    edicao,
    textoCompartilhamento,
  };
}

function validateProdutoInput(input: UpsertProdutoInput) {
  const codigo = input.codigo.trim();
  const nome = input.nome.trim();
  const categoria = input.categoria.trim() || "Sem categoria";

  if (!input.revistaId || !codigo || !nome) {
    throw new Error("Selecione a revista e preencha codigo e nome do produto.");
  }

  if (Number.isNaN(input.precoCatalogo) || input.precoCatalogo <= 0) {
    throw new Error("Informe um preco de catalogo valido.");
  }

  if (Number.isNaN(input.estoqueAtual) || input.estoqueAtual < 0) {
    throw new Error("Informe um estoque valido.");
  }

  return {
    ...input,
    codigo,
    nome,
    categoria,
  };
}

export async function saveRevistaAction(
  rawInput: UpsertRevistaInput,
): Promise<ActionResult> {
  if (!isCatalogoServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para salvar revistas.",
    };
  }

  try {
    await assertAdminActionAccess();
    const input = validateRevistaInput(rawInput);
    await upsertRevista(input);
    revalidateCatalogoViews();

    return {
      ok: true,
      message: input.id
        ? `${input.titulo} ${input.edicao} foi atualizada.`
        : `${input.titulo} ${input.edicao} foi criada.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui salvar a revista.",
    };
  }
}

export async function removeRevistaAction(id: string): Promise<ActionResult> {
  if (!isCatalogoServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para remover revistas.",
    };
  }

  try {
    await assertAdminActionAccess();
    await deleteRevista(id);
    revalidateCatalogoViews();

    return {
      ok: true,
      message: "Revista removida com sucesso.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui remover a revista.",
    };
  }
}

export async function saveProdutoAction(
  rawInput: UpsertProdutoInput,
): Promise<ActionResult> {
  if (!isCatalogoServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para salvar produtos.",
    };
  }

  try {
    await assertAdminActionAccess();
    const input = validateProdutoInput(rawInput);
    await upsertProduto(input);
    revalidateCatalogoViews();

    return {
      ok: true,
      message: input.id
        ? `${input.nome} foi atualizado.`
        : `${input.nome} foi criado.`,
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui salvar o produto.",
    };
  }
}

export async function removeProdutoAction(id: string): Promise<ActionResult> {
  if (!isCatalogoServerConfigured()) {
    return {
      ok: false,
      message: "Supabase nao configurado para remover produtos.",
    };
  }

  try {
    await assertAdminActionAccess();
    await deleteProduto(id);
    revalidateCatalogoViews();

    return {
      ok: true,
      message: "Produto removido com sucesso.",
    };
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Nao consegui remover o produto.",
    };
  }
}
