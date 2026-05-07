"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useMemo, useState, useTransition } from "react";
import {
  createPedidoAction,
  removePedidoAction,
  updatePedidoStatusAction,
} from "@/app/pedidos/actions";
import { formatCurrency, formatPercent, formatShortDate } from "@/lib/formatters";
import type {
  Pedido,
  Produto,
  StatusPedido,
  Vendedora,
} from "@/lib/types";
import {
  buildWhatsAppOrderLink,
  buildWhatsAppOrderText,
} from "@/lib/whatsapp";

type DraftItem = {
  produtoId: string;
  quantidade: string;
};

const EMPTY_ITEM: DraftItem = {
  produtoId: "",
  quantidade: "1",
};

export function PedidosBoard({
  pedidos,
  produtos,
  vendedoras,
  whatsappDestino,
}: {
  pedidos: Pedido[];
  produtos: Produto[];
  vendedoras: Vendedora[];
  whatsappDestino: string;
}) {
  const router = useRouter();
  const [vendedoraId, setVendedoraId] = useState(vendedoras[0]?.id ?? "");
  const [status, setStatus] = useState<StatusPedido>("pendente");
  const [observacoes, setObservacoes] = useState("");
  const [items, setItems] = useState<DraftItem[]>([{ ...EMPTY_ITEM }]);
  const [feedback, setFeedback] = useState(
    "Pedidos prontos para lancamento.",
  );
  const [isPending, startTransition] = useTransition();

  const counts = {
    pendente: pedidos.filter((pedido) => pedido.status === "pendente").length,
    separacao: pedidos.filter((pedido) => pedido.status === "separacao").length,
    pago: pedidos.filter((pedido) => pedido.status === "pago").length,
  };

  const produtosMap = useMemo(
    () => new Map(produtos.map((produto) => [produto.id, produto])),
    [produtos],
  );
  const vendedorasMap = useMemo(
    () => new Map(vendedoras.map((vendedora) => [vendedora.id, vendedora])),
    [vendedoras],
  );

  const draftPreview = useMemo(() => {
    const currentVendedora = vendedorasMap.get(vendedoraId);
    const validItems = items
      .map((item, index) => {
        const produto = produtosMap.get(item.produtoId);
        const quantidade = Number(item.quantidade);

        if (!produto || Number.isNaN(quantidade) || quantidade <= 0) {
          return null;
        }

        const percentual =
          produto.margemComissao ?? currentVendedora?.percentualComissao ?? 0;

        return {
          id: `draft-${index}`,
          produtoId: produto.id,
          produtoNome: produto.nome,
          revistaTitulo: produto.revistaTitulo,
          quantidade,
          precoUnitario: produto.precoCatalogo,
          percentualComissao: percentual,
        };
      })
      .filter((item) => item !== null);

    const valorTotal = validItems.reduce(
      (sum, item) => sum + item.precoUnitario * item.quantidade,
      0,
    );
    const comissaoCalculada = validItems.reduce(
      (sum, item) =>
        sum +
        item.precoUnitario * item.quantidade * (item.percentualComissao / 100),
      0,
    );

    return {
      currentVendedora,
      validItems,
      valorTotal,
      comissaoCalculada,
    };
  }, [items, produtosMap, vendedoraId, vendedorasMap]);

  function updateItem(index: number, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );
  }

  function addItem() {
    setItems((current) => [...current, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((current) =>
      current.length === 1
        ? [{ ...EMPTY_ITEM }]
        : current.filter((_, itemIndex) => itemIndex !== index),
    );
  }

  function resetForm() {
    setVendedoraId(vendedoras[0]?.id ?? "");
    setStatus("pendente");
    setObservacoes("");
    setItems([{ ...EMPTY_ITEM }]);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createPedidoAction({
        vendedoraId,
        status,
        observacoes,
        itens: items.map((item) => ({
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
        })),
      });

      setFeedback(result.message);

      if (result.ok) {
        resetForm();
        router.refresh();
      }
    });
  }

  function updateStatus(id: string, nextStatus: StatusPedido) {
    startTransition(async () => {
      const result = await updatePedidoStatusAction(id, nextStatus);
      setFeedback(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  function removePedido(id: string) {
    startTransition(async () => {
      const result = await removePedidoAction(id);
      setFeedback(result.message);

      if (result.ok) {
        router.refresh();
      }
    });
  }

  const inputClass =
    "mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-accent focus:bg-white";

  return (
    <div className="grid gap-6">
      <section className="surface-card-strong rounded-[32px] p-6 sm:p-8">
        <div className="grid gap-5 lg:grid-cols-3">
          <article className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
            <p className="text-sm text-muted">Aguardando confirmacao</p>
            <p className="mt-2 font-display text-4xl">{counts.pendente}</p>
          </article>
          <article className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
            <p className="text-sm text-muted">Em separacao</p>
            <p className="mt-2 font-display text-4xl">{counts.separacao}</p>
          </article>
          <article className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
            <p className="text-sm text-muted">Ja pagos</p>
            <p className="mt-2 font-display text-4xl">{counts.pago}</p>
          </article>
        </div>

        <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-4 text-sm text-muted">
          <p className="font-semibold text-foreground">Status</p>
          <p className="mt-1">{feedback}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.96fr_1.04fr]">
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div>
            <span className="eyebrow">Novo pedido</span>
            <h2 className="mt-2 font-display text-2xl">
              Lancamento do atendimento
            </h2>
          </div>

          {vendedoras.length === 0 || produtos.length === 0 ? (
            <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--line)] p-6 text-sm leading-6 text-muted">
              Cadastre ao menos uma vendedora e um produto para criar pedidos
              reais.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  Vendedora
                  <select
                    value={vendedoraId}
                    onChange={(event) => setVendedoraId(event.target.value)}
                    className={inputClass}
                  >
                    <option value="">Selecione</option>
                    {vendedoras.map((vendedora) => (
                      <option key={vendedora.id} value={vendedora.id}>
                        {vendedora.nome}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-sm font-medium">
                  Status inicial
                  <select
                    value={status}
                    onChange={(event) =>
                      setStatus(event.target.value as StatusPedido)
                    }
                    className={inputClass}
                  >
                    <option value="pendente">pendente</option>
                    <option value="separacao">separacao</option>
                    <option value="pago">pago</option>
                    <option value="rascunho">rascunho</option>
                  </select>
                </label>
              </div>

              <label className="text-sm font-medium">
                Observacoes
                <textarea
                  value={observacoes}
                  onChange={(event) => setObservacoes(event.target.value)}
                  rows={3}
                  placeholder="Ex.: cliente prefere entrega na sexta."
                  className={`${inputClass} resize-none`}
                />
              </label>

              <div className="rounded-[24px] border border-[color:var(--line)] bg-white/60 p-4">
                <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          Itens do pedido
                        </p>
                      </div>
                  <button
                    type="button"
                    onClick={addItem}
                    className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
                  >
                    Adicionar item
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {items.map((item, index) => {
                    const produto = produtosMap.get(item.produtoId);

                    return (
                      <div
                        key={`draft-item-${index}`}
                        className="grid gap-3 rounded-[20px] border border-[color:var(--line)] bg-white/80 p-4 md:grid-cols-[1.4fr_0.45fr_0.35fr]"
                      >
                        <label className="text-sm font-medium">
                          Produto
                          <select
                            value={item.produtoId}
                            onChange={(event) =>
                              updateItem(index, { produtoId: event.target.value })
                            }
                            className={inputClass}
                          >
                            <option value="">Selecione um produto</option>
                            {produtos
                              .filter((produtoItem) => produtoItem.ativo !== false)
                              .map((produtoItem) => (
                                <option key={produtoItem.id} value={produtoItem.id}>
                                  {produtoItem.nome} | {produtoItem.revistaTitulo}
                                </option>
                              ))}
                          </select>
                        </label>

                        <label className="text-sm font-medium">
                          Quantidade
                          <input
                            value={item.quantidade}
                            onChange={(event) =>
                              updateItem(index, { quantidade: event.target.value })
                            }
                            inputMode="numeric"
                            className={inputClass}
                          />
                        </label>

                        <div className="flex flex-col justify-end">
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="rounded-full border border-[#e7c9b8] bg-[#fff3ea] px-4 py-3 text-sm font-semibold text-warm transition hover:bg-[#ffe8d6]"
                          >
                            Remover
                          </button>
                        </div>

                        {produto ? (
                          <div className="md:col-span-3 rounded-[18px] bg-[#f7f3ec] px-4 py-3 text-sm text-muted">
                            {produto.codigo} | {produto.categoria} |{" "}
                            {formatCurrency(produto.precoCatalogo)} | margem{" "}
                            {formatPercent(
                              produto.margemComissao ??
                                draftPreview.currentVendedora
                                  ?.percentualComissao ??
                                0,
                            )}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <article className="rounded-[22px] border border-[color:var(--line)] bg-[#fff7ee] p-4">
                  <p className="text-sm text-muted">Total estimado</p>
                  <p className="mt-2 font-display text-3xl">
                    {formatCurrency(draftPreview.valorTotal)}
                  </p>
                </article>
                <article className="rounded-[22px] border border-[color:var(--line)] bg-[#eef8f4] p-4">
                  <p className="text-sm text-muted">Comissao estimada</p>
                  <p className="mt-2 font-display text-3xl">
                    {formatCurrency(draftPreview.comissaoCalculada)}
                  </p>
                </article>
                <article className="rounded-[22px] border border-[color:var(--line)] bg-white/70 p-4">
                  <p className="text-sm text-muted">Itens validos</p>
                  <p className="mt-2 font-display text-3xl">
                    {draftPreview.validItems.length}
                  </p>
                </article>
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
              >
                Criar pedido
              </button>
            </form>
          )}
        </section>

        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div>
            <span className="eyebrow">WhatsApp</span>
            <h2 className="mt-2 font-display text-2xl">Mensagem pronta</h2>
          </div>

          {draftPreview.currentVendedora && draftPreview.validItems.length ? (
            <>
              <div className="mt-6 rounded-[24px] bg-[#1f1e1b] p-5 text-sm leading-6 text-[#f4eee4]">
                <pre className="whitespace-pre-wrap font-sans">
                  {buildWhatsAppOrderText({
                    id: "draft",
                    codigo: "PED-RASCUNHO",
                    vendedoraId: draftPreview.currentVendedora.id,
                    vendedoraNome: draftPreview.currentVendedora.nome,
                    status,
                    criadoEm: new Date().toISOString(),
                    valorTotal: draftPreview.valorTotal,
                    comissaoCalculada: draftPreview.comissaoCalculada,
                    itens: draftPreview.validItems,
                    observacoes,
                  })}
                </pre>
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <a
                  href={buildWhatsAppOrderLink(
                    {
                      id: "draft",
                      codigo: "PED-RASCUNHO",
                      vendedoraId: draftPreview.currentVendedora.id,
                      vendedoraNome: draftPreview.currentVendedora.nome,
                      status,
                      criadoEm: new Date().toISOString(),
                      valorTotal: draftPreview.valorTotal,
                      comissaoCalculada: draftPreview.comissaoCalculada,
                      itens: draftPreview.validItems,
                      observacoes,
                    },
                    whatsappDestino,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-[#1d1915] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Abrir no WhatsApp
                </a>
              </div>
            </>
          ) : (
            <div className="mt-6 rounded-[24px] border border-dashed border-[color:var(--line)] p-6 text-sm text-muted">
              Selecione uma vendedora e adicione itens.
            </div>
          )}
        </section>
      </div>

      <section className="surface-card rounded-[28px] p-6 sm:p-8">
        <div>
          <span className="eyebrow">Fila de pedidos</span>
          <h2 className="mt-2 font-display text-2xl">
            Acompanhamento da operacao
          </h2>
        </div>

        <div className="mt-6 grid gap-4">
          {pedidos.length ? (
            pedidos.map((pedido) => (
              <article
                key={pedido.id}
                className="rounded-[24px] border border-[color:var(--line)] bg-white/60 p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div>
                    <p className="text-sm text-muted">
                      {pedido.codigo} | {pedido.vendedoraNome}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {formatCurrency(pedido.valorTotal)} em {pedido.itens.length}{" "}
                      itens
                    </h3>
                    <p className="mt-2 text-sm text-muted">
                      Criado em {formatShortDate(pedido.criadoEm)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className="rounded-full bg-[#fff3e5] px-3 py-1 text-sm font-semibold text-warm">
                      {pedido.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateStatus(pedido.id, "separacao")}
                      className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
                    >
                      Separacao
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(pedido.id, "pago")}
                      className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
                    >
                      Pago
                    </button>
                    <button
                      type="button"
                      onClick={() => removePedido(pedido.id)}
                      className="rounded-full border border-[#e7c9b8] bg-[#fff3ea] px-4 py-2 text-sm font-semibold text-warm transition hover:bg-[#ffe8d6]"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Total
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(pedido.valorTotal)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Comissao
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(pedido.comissaoCalculada)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      WhatsApp
                    </p>
                    <a
                      href={buildWhatsAppOrderLink(pedido, whatsappDestino)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-block font-semibold text-accent"
                    >
                      Abrir mensagem
                    </a>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {pedido.itens.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[18px] border border-[color:var(--line)] bg-white/75 p-4"
                    >
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        {item.revistaTitulo}
                      </p>
                      <p className="mt-1 font-semibold">{item.produtoNome}</p>
                      <p className="mt-2 text-sm text-muted">
                        {item.quantidade}x | {formatCurrency(item.precoUnitario)}
                      </p>
                    </div>
                  ))}
                </div>

                {pedido.observacoes ? (
                  <p className="mt-4 rounded-[18px] border border-dashed border-[color:var(--line)] p-4 text-sm leading-6 text-muted">
                    {pedido.observacoes}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--line)] p-8 text-center text-sm text-muted">
              Nenhum pedido cadastrado.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
