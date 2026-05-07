"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { createMinhaAreaPedidoAction } from "@/app/minha-area/actions";
import {
  formatCurrency,
  formatPercent,
  formatPhone,
} from "@/lib/formatters";
import type { Pedido, Produto, Vendedora } from "@/lib/types";
import {
  buildPedidoObservacoesText,
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

const MAX_VISIBLE_CATALOGO_ITEMS = 120;

export function MinhaAreaOrderBuilder({
  pedidosRecentes,
  produtos,
  vendedora,
  whatsappDestino,
  initialRevistaId,
  initialProdutoId,
}: {
  pedidosRecentes: Pedido[];
  produtos: Produto[];
  vendedora: Vendedora;
  whatsappDestino: string;
  initialRevistaId?: string;
  initialProdutoId?: string;
}) {
  const router = useRouter();
  const initialProduto = initialProdutoId
    ? produtos.find((produto) => produto.id === initialProdutoId)
    : undefined;
  const [clienteNome, setClienteNome] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [items, setItems] = useState<DraftItem[]>(() =>
    initialProduto
      ? [{ produtoId: initialProduto.id, quantidade: "1" }]
      : [{ ...EMPTY_ITEM }],
  );
  const [selectedRevistaId, setSelectedRevistaId] = useState(
    initialProduto?.revistaId ?? initialRevistaId ?? produtos[0]?.revistaId ?? "",
  );
  const [catalogSearch, setCatalogSearch] = useState("");
  const [quickQuantities, setQuickQuantities] = useState<
    Record<string, string>
  >({});
  const [feedback, setFeedback] = useState(
    initialProduto
      ? `${initialProduto.nome} entrou na cesta e ja pode seguir para o pedido.`
      : "Quando confirmar, o pedido entra como pendente no sistema e o WhatsApp abre com a mensagem pronta.",
  );
  const [isPending, startTransition] = useTransition();

  const produtosAtivos = useMemo(
    () =>
      [...produtos]
        .filter((produto) => produto.ativo !== false)
        .sort((left, right) => {
          const byRevista = left.revistaTitulo.localeCompare(right.revistaTitulo);
          return byRevista !== 0 ? byRevista : left.nome.localeCompare(right.nome);
        }),
    [produtos],
  );

  const produtosMap = useMemo(
    () => new Map(produtosAtivos.map((produto) => [produto.id, produto])),
    [produtosAtivos],
  );

  const revistasDisponiveis = useMemo(() => {
    const revistasMap = new Map<string, string>();

    produtosAtivos.forEach((produto) => {
      if (!revistasMap.has(produto.revistaId)) {
        revistasMap.set(produto.revistaId, produto.revistaTitulo);
      }
    });

    return [...revistasMap.entries()].map(([id, titulo]) => ({
      id,
      titulo,
    }));
  }, [produtosAtivos]);

  const revistaAtivaId = useMemo(
    () =>
      revistasDisponiveis.some((revista) => revista.id === selectedRevistaId)
        ? selectedRevistaId
        : revistasDisponiveis[0]?.id ?? "",
    [revistasDisponiveis, selectedRevistaId],
  );

  const draftPreview = useMemo(() => {
    const validItems: Pedido["itens"] = [];

    items.forEach((item, index) => {
      const produto = produtosMap.get(item.produtoId);
      const quantidade = Number(item.quantidade);

      if (!produto || Number.isNaN(quantidade) || quantidade <= 0) {
        return;
      }

      const percentualComissao =
        produto.margemComissao ?? vendedora.percentualComissao ?? 0;

      validItems.push({
        id: `draft-${index}`,
        produtoId: produto.id,
        produtoNome: produto.nome,
        revistaTitulo: produto.revistaTitulo,
        quantidade,
        precoUnitario: produto.precoCatalogo,
        percentualComissao,
      });
    });

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
    const observacoesTexto = buildPedidoObservacoesText(clienteNome, observacoes);
    const pedidoDraft: Pedido = {
      id: "draft-whatsapp",
      codigo: "PED-WHATSAPP",
      vendedoraId: vendedora.id,
      vendedoraNome: vendedora.nome,
      status: "rascunho",
      criadoEm: new Date().toISOString(),
      valorTotal,
      comissaoCalculada,
      itens: validItems,
      observacoes: observacoesTexto,
    };

    return {
      validItems,
      valorTotal,
      comissaoCalculada,
      observacoesTexto,
      pedidoDraft,
    };
  }, [clienteNome, observacoes, items, produtosMap, vendedora]);

  const produtosFiltradosCatalogo = useMemo(() => {
    const search = catalogSearch.trim().toLowerCase();

    return produtosAtivos
      .filter((produto) => {
        if (revistaAtivaId && produto.revistaId !== revistaAtivaId) {
          return false;
        }

        if (!search) {
          return true;
        }

        return `${produto.nome} ${produto.codigo} ${produto.categoria} ${produto.revistaTitulo}`
          .toLowerCase()
          .includes(search);
      })
      .sort((left, right) => {
        const byName = left.nome.localeCompare(right.nome);
        return byName !== 0 ? byName : left.codigo.localeCompare(right.codigo);
      });
  }, [catalogSearch, produtosAtivos, revistaAtivaId]);

  const produtosVisiveisCatalogo = useMemo(
    () => produtosFiltradosCatalogo.slice(0, MAX_VISIBLE_CATALOGO_ITEMS),
    [produtosFiltradosCatalogo],
  );

  const itensNaCesta = useMemo(
    () =>
      draftPreview.validItems.reduce((sum, item) => sum + item.quantidade, 0),
    [draftPreview.validItems],
  );

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
    setClienteNome("");
    setObservacoes("");
    setItems([{ ...EMPTY_ITEM }]);
    setQuickQuantities({});
  }

  function updateQuickQuantity(produtoId: string, quantidade: string) {
    setQuickQuantities((current) => ({
      ...current,
      [produtoId]: quantidade,
    }));
  }

  function addProductToDraft(produtoId: string, quantidade = 1) {
    const produto = produtosMap.get(produtoId);

    if (!produto) {
      return;
    }

    const quantidadeSegura = Math.max(1, Math.trunc(quantidade) || 1);

    setSelectedRevistaId(produto.revistaId);
    setItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.produtoId === produtoId,
      );

      if (existingIndex >= 0) {
        return current.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantidade: String(
                  (Number(item.quantidade) || 0) + quantidadeSegura,
                ),
              }
            : item,
        );
      }

      if (current.length === 1 && !current[0].produtoId) {
        return [{ produtoId, quantidade: String(quantidadeSegura) }];
      }

      return [...current, { produtoId, quantidade: String(quantidadeSegura) }];
    });
    setFeedback(
      `${produto.nome} entrou na cesta com ${quantidadeSegura} unidade(s).`,
    );
  }

  function addProductFromCatalog(produtoId: string) {
    const quantidade = Math.max(
      1,
      Math.trunc(Number(quickQuantities[produtoId] ?? "1")) || 1,
    );

    addProductToDraft(produtoId, quantidade);
    updateQuickQuantity(produtoId, "1");
  }

  function splitPedidoObservacoesText(value?: string) {
    const linhas = (value ?? "")
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean);
    const detalheLinhas: string[] = [];
    let proximoCliente = "";

    linhas.forEach((linha) => {
      if (linha.startsWith("Cliente final:")) {
        proximoCliente = linha.replace("Cliente final:", "").trim();
        return;
      }

      if (linha.startsWith("Detalhes:")) {
        detalheLinhas.push(linha.replace("Detalhes:", "").trim());
        return;
      }

      detalheLinhas.push(linha);
    });

    return {
      cliente: proximoCliente,
      detalhes: detalheLinhas.join("\n"),
    };
  }

  function carregarPedidoNoRascunho(pedido: Pedido) {
    const itensDisponiveis = pedido.itens.filter((item) =>
      produtosMap.has(item.produtoId),
    );

    if (!itensDisponiveis.length) {
      setFeedback(
        `O pedido ${pedido.codigo} nao tem itens disponiveis no seu catalogo atual.`,
      );
      return;
    }

    const itensIndisponiveis = pedido.itens.length - itensDisponiveis.length;
    const observacoesSeparadas = splitPedidoObservacoesText(pedido.observacoes);

    setItems(
      itensDisponiveis.map((item) => ({
        produtoId: item.produtoId,
        quantidade: String(item.quantidade),
      })),
    );
    setClienteNome(observacoesSeparadas.cliente);
    setObservacoes(observacoesSeparadas.detalhes);
    setFeedback(
      itensIndisponiveis > 0
        ? `Pedido ${pedido.codigo} carregado com ${itensDisponiveis.length} item(ns). ${itensIndisponiveis} item(ns) ficaram de fora porque nao estao mais liberados.`
        : `Pedido ${pedido.codigo} carregado no rascunho para voce ajustar e reenviar.`,
    );
    document
      .getElementById("montar-pedido")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function registrarPedidoEAbrirWhatsApp() {
    const popup = window.open("", "_blank");

    startTransition(async () => {
      const result = await createMinhaAreaPedidoAction({
        clienteNome,
        observacoes,
        itens: items.map((item) => ({
          produtoId: item.produtoId,
          quantidade: Number(item.quantidade),
        })),
      });

      setFeedback(result.message);

      if (!result.ok || !result.whatsappLink) {
        popup?.close();
        return;
      }

      popup?.location.replace(result.whatsappLink);
      resetForm();
      router.refresh();
    });
  }

  const hasPedidoPronto = draftPreview.validItems.length > 0;
  const inputClass =
    "mt-2 w-full rounded-[18px] border border-[#d8e7df] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0f766e] focus:bg-[#fffcf7]";

  return (
    <section
      id="montar-pedido"
      className="overflow-hidden rounded-[30px] border border-[#dbeee8] bg-[#f8fffb] shadow-[0_22px_70px_rgba(15,118,110,0.1)]"
    >
      <div className="border-b border-[#dbeee8] bg-[linear-gradient(135deg,#ecfdf5_0%,#fef3c7_100%)] px-6 py-5 sm:px-8">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <span className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
              Montar pedido
            </span>
            <h2 className="mt-2 font-display text-2xl">
              Pedido pronto para sair pelo WhatsApp
            </h2>
            <p className="mt-3 text-sm leading-6 text-muted sm:text-base">
              Escolha os itens do seu catalogo, ajuste as quantidades e abra a
              mensagem ja estruturada para enviar para a central sem depender do
              painel da gerente.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[290px] xl:grid-cols-1">
            <div className="rounded-[22px] border border-[#dbeee8] bg-white/85 p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                Produtos liberados
              </p>
              <p className="mt-2 font-display text-3xl">{produtosAtivos.length}</p>
            </div>
            <div className="rounded-[22px] border border-[#f3ddbf] bg-[#fff8ee] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#b45309]">
                Destino configurado
              </p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {formatPhone(whatsappDestino)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 px-6 py-6 sm:px-8 xl:grid-cols-[1.06fr_0.94fr]">
        <div className="grid gap-4">
          <div className="rounded-[22px] border border-dashed border-[#dbeee8] bg-white/75 p-4 text-sm leading-6 text-muted">
            <p className="font-semibold text-foreground">Status do envio</p>
            <p className="mt-2">{feedback}</p>
          </div>

          {pedidosRecentes.length ? (
            <div className="rounded-[24px] border border-[#dbeee8] bg-white p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Reaproveitar pedido anterior
                  </p>
                  <p className="text-sm text-muted">
                    Puxe um pedido salvo para repetir o mix ou reenviar a mensagem.
                  </p>
                </div>
                <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-sm font-semibold text-accent">
                  {pedidosRecentes.length} no historico
                </span>
              </div>

              <div className="mt-4 grid gap-3">
                {pedidosRecentes.slice(0, 3).map((pedido) => (
                  <article
                    key={`atalho-${pedido.id}`}
                    className="rounded-[20px] border border-[#e8f2ed] bg-[#fffcf7] p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <p className="text-sm text-muted">{pedido.codigo}</p>
                        <p className="mt-1 font-semibold text-foreground">
                          {pedido.itens.length} item(ns) |{" "}
                          {formatCurrency(pedido.valorTotal)}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => carregarPedidoNoRascunho(pedido)}
                          className="rounded-full border border-[#dbeee8] px-4 py-2 text-sm font-semibold transition hover:bg-white"
                        >
                          Repetir pedido
                        </button>
                        <a
                          href={buildWhatsAppOrderLink(pedido, whatsappDestino)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#f3ddbf] bg-[#fff8ee] px-4 py-2 text-sm font-semibold text-[#b45309] transition hover:bg-[#fff3df]"
                        >
                          Reenviar WhatsApp
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium">
              Cliente final
              <input
                value={clienteNome}
                onChange={(event) => setClienteNome(event.target.value)}
                placeholder="Ex.: Maria do bairro novo"
                className={inputClass}
              />
            </label>

            <article className="rounded-[22px] border border-[#dbeee8] bg-white p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                Sua comissao base
              </p>
              <p className="mt-2 font-display text-3xl">
                {formatPercent(vendedora.percentualComissao)}
              </p>
            </article>
          </div>

          <label className="text-sm font-medium">
            Observacoes do atendimento
            <textarea
              value={observacoes}
              onChange={(event) => setObservacoes(event.target.value)}
              rows={3}
              placeholder="Ex.: entregar na sexta ou separar uma cor especifica."
              className={`${inputClass} resize-none`}
            />
          </label>

          <div className="rounded-[24px] border border-[#dbeee8] bg-white p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Cesta do pedido
                </p>
                <p className="text-sm text-muted">
                  Monte, ajuste e revise o que vai seguir no WhatsApp.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="rounded-full bg-[#ecfdf5] px-3 py-2 text-sm font-semibold text-accent">
                  {itensNaCesta} unidade(s) na cesta
                </span>
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded-full border border-[#dbeee8] px-4 py-2 text-sm font-semibold transition hover:bg-[#f8fffb]"
                >
                  Adicionar item
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-[#f3ddbf] bg-[#fff8ee] px-4 py-2 text-sm font-semibold text-[#b45309] transition hover:bg-[#fff3df]"
                >
                  Limpar
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {items.map((item, index) => {
                const produto = produtosMap.get(item.produtoId);

                return (
                  <div
                    key={`pedido-item-${index}`}
                    className="grid gap-3 rounded-[20px] border border-[#e8f2ed] bg-[#fffcf7] p-4 md:grid-cols-[1.45fr_0.45fr_0.35fr]"
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
                        {produtosAtivos.map((produtoItem) => (
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
                        className="rounded-full border border-[#f3ddbf] bg-white px-4 py-3 text-sm font-semibold text-[#b45309] transition hover:bg-[#fff3df]"
                      >
                        Remover
                      </button>
                    </div>

                    {produto ? (
                      <div className="md:col-span-3 rounded-[18px] bg-white px-4 py-3 text-sm text-muted">
                        {produto.codigo} | {produto.categoria} |{" "}
                        {formatCurrency(produto.precoCatalogo)} | estoque{" "}
                        {produto.estoqueAtual} | margem{" "}
                        {formatPercent(
                          produto.margemComissao ?? vendedora.percentualComissao,
                        )}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          <div
            id="catalogo-clique"
            className="rounded-[24px] border border-[#dbeee8] bg-[#ecfdf5] p-4"
          >
            <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  Catalogo clicavel
                </p>
                <p className="text-sm text-muted">
                  Toque no item da revista para jogar direto na cesta do pedido.
                </p>
              </div>
              <a
                href="#montar-pedido"
                className="rounded-full border border-[#dbeee8] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#f8fffb]"
              >
                Voltar para a cesta
              </a>
            </div>

            {revistasDisponiveis.length ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {revistasDisponiveis.map((revista) => (
                    <button
                      key={revista.id}
                      type="button"
                      onClick={() => setSelectedRevistaId(revista.id)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        revista.id === revistaAtivaId
                          ? "bg-[#0f766e] text-white"
                          : "border border-[#dbeee8] bg-white text-foreground hover:bg-[#f8fffb]"
                      }`}
                    >
                      {revista.titulo}
                    </button>
                  ))}
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_0.2fr]">
                  <label className="text-sm font-medium">
                    Buscar item, codigo ou categoria
                    <input
                      value={catalogSearch}
                      onChange={(event) => setCatalogSearch(event.target.value)}
                      placeholder="Ex.: shampoo, 55802 ou perfumaria"
                      className={inputClass}
                    />
                  </label>

                  <article className="rounded-[22px] border border-[#dbeee8] bg-white p-4">
                    <p className="text-sm text-muted">Itens desta leitura</p>
                    <p className="mt-2 font-display text-3xl">
                      {produtosFiltradosCatalogo.length}
                    </p>
                  </article>
                </div>

                {produtosFiltradosCatalogo.length > MAX_VISIBLE_CATALOGO_ITEMS ? (
                  <p className="mt-4 text-sm text-muted">
                    Mostrando os primeiros {MAX_VISIBLE_CATALOGO_ITEMS} itens. Use
                    a busca para chegar mais rapido no produto.
                  </p>
                ) : null}

                <div className="mt-4 grid gap-3">
                  {produtosVisiveisCatalogo.length ? (
                    produtosVisiveisCatalogo.map((produto) => (
                      <article
                        key={`catalogo-item-${produto.id}`}
                        className="grid gap-3 rounded-[20px] border border-[#dbeee8] bg-white p-4 xl:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <p className="text-sm text-muted">
                            {produto.revistaTitulo} | {produto.codigo}
                          </p>
                          <h3 className="mt-1 text-base font-semibold text-foreground">
                            {produto.nome}
                          </h3>
                          <p className="mt-2 text-sm text-muted">
                            {produto.categoria} | estoque {produto.estoqueAtual}
                          </p>
                          <p className="mt-3 text-lg font-semibold text-[#0f766e]">
                            {formatCurrency(produto.precoCatalogo)}
                          </p>
                        </div>

                        <div className="flex flex-col gap-3 xl:min-w-[240px]">
                          <label className="text-sm font-medium">
                            Quantidade
                            <input
                              value={quickQuantities[produto.id] ?? "1"}
                              onChange={(event) =>
                                updateQuickQuantity(produto.id, event.target.value)
                              }
                              inputMode="numeric"
                              className={inputClass}
                            />
                          </label>

                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => addProductFromCatalog(produto.id)}
                              className="rounded-full bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#115e59]"
                            >
                              Adicionar a cesta
                            </button>
                            <a
                              href={`/minha-area?revista=${produto.revistaId}&item=${produto.id}#montar-pedido`}
                              className="rounded-full border border-[#dbeee8] px-4 py-2 text-sm font-semibold transition hover:bg-[#f8fffb]"
                            >
                              Abrir na cesta
                            </a>
                          </div>
                        </div>
                      </article>
                    ))
                  ) : (
                    <div className="rounded-[20px] border border-dashed border-[#dbeee8] bg-white/80 p-5 text-sm text-muted">
                      Nenhum item encontrado com esse filtro.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="mt-4 rounded-[20px] border border-dashed border-[#dbeee8] bg-white/80 p-5 text-sm text-muted">
                Os produtos ainda nao foram carregados para a sua revista.
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <article className="rounded-[22px] border border-[#dbeee8] bg-white p-4">
              <p className="text-sm text-muted">Total estimado</p>
              <p className="mt-2 font-display text-3xl">
                {formatCurrency(draftPreview.valorTotal)}
              </p>
            </article>
            <article className="rounded-[22px] border border-[#dbeee8] bg-[#ecfdf5] p-4">
              <p className="text-sm text-muted">Comissao estimada</p>
              <p className="mt-2 font-display text-3xl">
                {formatCurrency(draftPreview.comissaoCalculada)}
              </p>
            </article>
            <article className="rounded-[22px] border border-[#f3ddbf] bg-[#fff8ee] p-4">
              <p className="text-sm text-muted">Itens validos</p>
              <p className="mt-2 font-display text-3xl">
                {draftPreview.validItems.length}
              </p>
            </article>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#dbeee8] bg-[#0f172a] p-6 text-white shadow-[0_22px_70px_rgba(15,23,42,0.22)] sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span className="text-xs uppercase tracking-[0.22em] text-[#86efac]">
                Preview
              </span>
              <h3 className="mt-2 font-display text-2xl">
                Mensagem pronta para enviar
              </h3>
            </div>
            <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-sm font-semibold text-white/90">
              {hasPedidoPronto ? "Pronto para abrir" : "Aguardando itens"}
            </span>
          </div>

          {hasPedidoPronto ? (
            <>
              <div className="mt-6 rounded-[22px] border border-white/10 bg-white/5 p-5">
                <pre className="whitespace-pre-wrap font-sans text-sm leading-6 text-white/88">
                  {buildWhatsAppOrderText(draftPreview.pedidoDraft)}
                </pre>
              </div>

              {draftPreview.observacoesTexto ? (
                <p className="mt-4 rounded-[18px] border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white/75">
                  O bloco de observacoes tambem vai junto no texto do pedido.
                </p>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={registrarPedidoEAbrirWhatsApp}
                  disabled={isPending}
                  className="rounded-full bg-[#f59e0b] px-5 py-3 text-sm font-semibold text-[#1f2937] transition hover:bg-[#fbbf24] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isPending
                    ? "Registrando pedido..."
                    : "Registrar pedido e abrir WhatsApp"}
                </button>
                <a
                  href={buildWhatsAppOrderLink(
                    draftPreview.pedidoDraft,
                    whatsappDestino,
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Abrir sem salvar
                </a>
                <button
                  type="button"
                  onClick={resetForm}
                  className="rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                >
                  Limpar rascunho
                </button>
              </div>
            </>
          ) : (
            <div className="mt-6 grid gap-3">
              <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">
                  1. Escolha os produtos
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  Use somente os itens liberados para o seu catalogo.
                </p>
              </article>
              <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">
                  2. Ajuste as quantidades
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  O total e a sua comissao sao calculados na hora.
                </p>
              </article>
              <article className="rounded-[20px] border border-white/10 bg-white/5 p-4">
                <p className="text-sm font-semibold text-white">
                  3. Abra o WhatsApp
                </p>
                <p className="mt-2 text-sm leading-6 text-white/72">
                  A conversa abre com o pedido pronto para revisar e enviar.
                </p>
              </article>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
