"use client";

import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useDeferredValue,
  useState,
  useTransition,
} from "react";
import {
  removeProdutoAction,
  removeRevistaAction,
  saveProdutoAction,
  saveRevistaAction,
} from "@/app/catalogo/actions";
import {
  buildCatalogShareText,
  buildCatalogWhatsAppShareLink,
} from "@/lib/catalogo-share";
import { formatCurrency, formatPercent } from "@/lib/formatters";
import type { Produto, Revista } from "@/lib/types";

type RevistaDraft = {
  titulo: string;
  edicao: string;
  vigenciaInicio: string;
  vigenciaFim: string;
  margemPadrao: string;
  catalogoUrl: string;
  catalogoNomeArquivo: string;
  textoCompartilhamento: string;
  ativa: boolean;
};

type ProdutoDraft = {
  revistaId: string;
  codigo: string;
  nome: string;
  categoria: string;
  precoCatalogo: string;
  estoqueAtual: string;
  margemComissao: string;
  ativo: boolean;
};

const EMPTY_REVISTA: RevistaDraft = {
  titulo: "",
  edicao: "",
  vigenciaInicio: "",
  vigenciaFim: "",
  margemPadrao: "25",
  catalogoUrl: "",
  catalogoNomeArquivo: "",
  textoCompartilhamento: "",
  ativa: true,
};

const EMPTY_PRODUTO: ProdutoDraft = {
  revistaId: "",
  codigo: "",
  nome: "",
  categoria: "",
  precoCatalogo: "",
  estoqueAtual: "0",
  margemComissao: "",
  ativo: true,
};

function toRevistaDraft(revista: Revista): RevistaDraft {
  return {
    titulo: revista.titulo,
    edicao: revista.edicao,
    vigenciaInicio: revista.vigenciaInicio,
    vigenciaFim: revista.vigenciaFim,
    margemPadrao: String(revista.margemPadrao),
    catalogoUrl: revista.catalogoUrl ?? "",
    catalogoNomeArquivo: revista.catalogoNomeArquivo ?? "",
    textoCompartilhamento: revista.textoCompartilhamento ?? "",
    ativa: revista.ativa,
  };
}

function toProdutoDraft(produto: Produto): ProdutoDraft {
  return {
    revistaId: produto.revistaId,
    codigo: produto.codigo,
    nome: produto.nome,
    categoria: produto.categoria,
    precoCatalogo: String(produto.precoCatalogo),
    estoqueAtual: String(produto.estoqueAtual),
    margemComissao:
      produto.margemComissao === undefined ? "" : String(produto.margemComissao),
    ativo: produto.ativo ?? true,
  };
}

export function CatalogoBoard({
  revistas,
  produtos,
}: {
  revistas: Revista[];
  produtos: Produto[];
}) {
  const router = useRouter();
  const [revistaDraft, setRevistaDraft] = useState<RevistaDraft>(EMPTY_REVISTA);
  const [produtoDraft, setProdutoDraft] = useState<ProdutoDraft>(() => ({
    ...EMPTY_PRODUTO,
    revistaId: revistas[0]?.id ?? "",
  }));
  const [editingRevistaId, setEditingRevistaId] = useState<string | null>(null);
  const [editingProdutoId, setEditingProdutoId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadingCatalogo, setIsUploadingCatalogo] = useState(false);
  const [feedback, setFeedback] = useState(
    "Catalogo pronto para atualizacao.",
  );
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(searchTerm);

  const revistasAtivas = revistas.filter((item) => item.ativa).length;
  const produtosAtivos = produtos.filter((item) => item.ativo !== false).length;
  const estoqueTotal = produtos.reduce((sum, item) => sum + item.estoqueAtual, 0);
  const ticketCatalogo =
    produtos.length > 0
      ? produtos.reduce((sum, item) => sum + item.precoCatalogo, 0) / produtos.length
      : 0;

  const filteredProdutos = produtos.filter((produto) => {
    const query = deferredSearch.trim().toLowerCase();

    if (!query) {
      return true;
    }

    return `${produto.nome} ${produto.codigo} ${produto.categoria} ${produto.revistaTitulo}`
      .toLowerCase()
      .includes(query);
  });

  function updateRevistaDraft<Field extends keyof RevistaDraft>(
    field: Field,
    value: RevistaDraft[Field],
  ) {
    setRevistaDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateProdutoDraft<Field extends keyof ProdutoDraft>(
    field: Field,
    value: ProdutoDraft[Field],
  ) {
    setProdutoDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetRevistaForm() {
    setRevistaDraft(EMPTY_REVISTA);
    setEditingRevistaId(null);
  }

  function resetProdutoForm() {
    setProdutoDraft({
      ...EMPTY_PRODUTO,
      revistaId: revistas[0]?.id ?? "",
    });
    setEditingProdutoId(null);
  }

  function handleRevistaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveRevistaAction({
        id: editingRevistaId ?? undefined,
        titulo: revistaDraft.titulo.trim(),
        edicao: revistaDraft.edicao.trim(),
        vigenciaInicio: revistaDraft.vigenciaInicio,
        vigenciaFim: revistaDraft.vigenciaFim,
        margemPadrao: Number(revistaDraft.margemPadrao),
        catalogoUrl: revistaDraft.catalogoUrl.trim(),
        catalogoNomeArquivo: revistaDraft.catalogoNomeArquivo.trim(),
        textoCompartilhamento: revistaDraft.textoCompartilhamento.trim(),
        ativa: revistaDraft.ativa,
      });

      setFeedback(result.message);

      if (result.ok) {
        resetRevistaForm();
        router.refresh();
      }
    });
  }

  function handleProdutoSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await saveProdutoAction({
        id: editingProdutoId ?? undefined,
        revistaId: produtoDraft.revistaId,
        codigo: produtoDraft.codigo.trim(),
        nome: produtoDraft.nome.trim(),
        categoria: produtoDraft.categoria.trim(),
        precoCatalogo: Number(produtoDraft.precoCatalogo),
        estoqueAtual: Number(produtoDraft.estoqueAtual),
        margemComissao: produtoDraft.margemComissao
          ? Number(produtoDraft.margemComissao)
          : undefined,
        ativo: produtoDraft.ativo,
      });

      setFeedback(result.message);

      if (result.ok) {
        resetProdutoForm();
        router.refresh();
      }
    });
  }

  function startEditRevista(revista: Revista) {
    setEditingRevistaId(revista.id);
    setRevistaDraft(toRevistaDraft(revista));
    setFeedback(`Editando ${revista.titulo} ${revista.edicao}.`);
  }

  async function uploadCatalogo(file: File) {
    if (!file) {
      return;
    }

    setIsUploadingCatalogo(true);
    setFeedback("Enviando catalogo digital para o Supabase Storage...");

    try {
      const body = new FormData();
      body.append("file", file);
      body.append("titulo", revistaDraft.titulo || "catalogo");
      body.append("edicao", revistaDraft.edicao || "digital");

      const response = await fetch("/api/catalogos/upload", {
        method: "POST",
        body,
      });

      const payload = (await response.json()) as {
        ok: boolean;
        message?: string;
        publicUrl?: string;
        fileName?: string;
      };

      if (!response.ok || !payload.ok || !payload.publicUrl) {
        setFeedback(payload.message || "Nao consegui enviar o catalogo.");
        return;
      }

      setRevistaDraft((current) => ({
        ...current,
        catalogoUrl: payload.publicUrl ?? current.catalogoUrl,
        catalogoNomeArquivo: payload.fileName ?? current.catalogoNomeArquivo,
      }));
      setFeedback("Catalogo digital enviado e pronto para compartilhamento.");
    } catch {
      setFeedback("Falha no upload do catalogo digital.");
    } finally {
      setIsUploadingCatalogo(false);
    }
  }

  function startEditProduto(produto: Produto) {
    setEditingProdutoId(produto.id);
    setProdutoDraft(toProdutoDraft(produto));
    setFeedback(`Editando produto ${produto.nome}.`);
  }

  function removeRevista(id: string) {
    startTransition(async () => {
      const result = await removeRevistaAction(id);
      setFeedback(result.message);

      if (result.ok) {
        if (editingRevistaId === id) {
          resetRevistaForm();
        }

        router.refresh();
      }
    });
  }

  function removeProduto(id: string) {
    startTransition(async () => {
      const result = await removeProdutoAction(id);
      setFeedback(result.message);

      if (result.ok) {
        if (editingProdutoId === id) {
          resetProdutoForm();
        }

        router.refresh();
      }
    });
  }

  const inputClass =
    "mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-accent focus:bg-white";

  return (
    <div className="grid gap-6">
      <section className="surface-card-strong rounded-[32px] p-6 sm:p-8">
        <div>
          <span className="eyebrow">Resumo</span>
          <h2 className="mt-2 font-display text-2xl">Catalogo</h2>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
            <p className="text-sm text-muted">Revistas ativas</p>
            <p className="mt-2 font-display text-4xl">{revistasAtivas}</p>
          </article>
          <article className="rounded-[24px] border border-[color:var(--line)] bg-white/70 p-5">
            <p className="text-sm text-muted">Produtos ativos</p>
            <p className="mt-2 font-display text-4xl">{produtosAtivos}</p>
          </article>
          <article className="rounded-[24px] border border-[color:var(--line)] bg-[#eef8f4] p-5">
            <p className="text-sm text-muted">Estoque total</p>
            <p className="mt-2 font-display text-4xl">{estoqueTotal}</p>
          </article>
          <article className="rounded-[24px] border border-[color:var(--line)] bg-[#fff5ea] p-5">
            <p className="text-sm text-muted">Preco medio</p>
            <p className="mt-2 font-display text-4xl">
              {formatCurrency(ticketCatalogo)}
            </p>
          </article>
        </div>

        <div className="mt-5 rounded-[20px] border border-dashed border-[color:var(--line)] bg-white/55 p-4 text-sm text-muted">
          <p className="font-semibold text-foreground">Status</p>
          <p className="mt-1">{feedback}</p>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="eyebrow">Revistas</span>
                <h2 className="mt-2 font-display text-2xl">
                  {editingRevistaId ? "Editar revista" : "Nova revista"}
                </h2>
              </div>

            {editingRevistaId ? (
              <button
                type="button"
                onClick={resetRevistaForm}
                className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <form onSubmit={handleRevistaSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Marca
                <input
                  value={revistaDraft.titulo}
                  onChange={(event) =>
                    updateRevistaDraft("titulo", event.target.value)
                  }
                  placeholder="Ex.: Avon"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Edicao
                <input
                  value={revistaDraft.edicao}
                  onChange={(event) =>
                    updateRevistaDraft("edicao", event.target.value)
                  }
                  placeholder="Ex.: Ciclo 10"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium">
                Inicio
                <input
                  type="date"
                  value={revistaDraft.vigenciaInicio}
                  onChange={(event) =>
                    updateRevistaDraft("vigenciaInicio", event.target.value)
                  }
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Fim
                <input
                  type="date"
                  value={revistaDraft.vigenciaFim}
                  onChange={(event) =>
                    updateRevistaDraft("vigenciaFim", event.target.value)
                  }
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Margem padrao
                <input
                  value={revistaDraft.margemPadrao}
                  onChange={(event) =>
                    updateRevistaDraft("margemPadrao", event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="25"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Link do catalogo digital
                <input
                  value={revistaDraft.catalogoUrl}
                  onChange={(event) =>
                    updateRevistaDraft("catalogoUrl", event.target.value)
                  }
                  placeholder="https://..."
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Nome do arquivo
                <input
                  value={revistaDraft.catalogoNomeArquivo}
                  onChange={(event) =>
                    updateRevistaDraft("catalogoNomeArquivo", event.target.value)
                  }
                  placeholder="catalogo-avon.pdf"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="text-sm font-medium">
              Texto de compartilhamento
              <textarea
                value={revistaDraft.textoCompartilhamento}
                onChange={(event) =>
                  updateRevistaDraft("textoCompartilhamento", event.target.value)
                }
                rows={3}
                placeholder="Mensagem pronta para enviar o catalogo as vendedoras."
                className={`${inputClass} resize-none`}
              />
            </label>

            <label className="text-sm font-medium">
              Upload do catalogo pronto da empresa
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];

                  if (file) {
                    void uploadCatalogo(file);
                  }

                  event.currentTarget.value = "";
                }}
                className={`${inputClass} file:mr-4 file:rounded-full file:border-0 file:bg-[#1d1915] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white`}
              />
            </label>

            {isUploadingCatalogo ? (
              <div className="rounded-[18px] border border-dashed border-[color:var(--line)] bg-white/60 px-4 py-3 text-sm text-muted">
                Upload em andamento...
              </div>
            ) : null}

            <label className="flex items-center gap-3 rounded-[18px] border border-[color:var(--line)] bg-white/65 px-4 py-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={revistaDraft.ativa}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateRevistaDraft("ativa", event.target.checked)
                }
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              Revista ativa na campanha atual
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
            >
              {editingRevistaId ? "Atualizar revista" : "Salvar revista"}
            </button>
          </form>

          <div className="mt-6 grid gap-3">
            {revistas.map((revista) => (
              <article
                key={revista.id}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted">{revista.edicao}</p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {revista.titulo}
                    </h3>
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                      revista.ativa
                        ? "bg-[#e8faf6] text-accent"
                        : "bg-[#f4eee7] text-muted"
                    }`}
                  >
                    {revista.ativa ? "ativa" : "encerrada"}
                  </span>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Vigencia
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {revista.vigenciaInicio} ate {revista.vigenciaFim}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Margem
                    </p>
                    <p className="mt-1 text-sm font-semibold">
                      {formatPercent(revista.margemPadrao)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-[18px] border border-[color:var(--line)] bg-[#fff9f2] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-muted">
                    Catalogo digital
                  </p>
                  <p className="mt-2 text-sm text-muted">
                    {revista.catalogoNomeArquivo ||
                      (revista.catalogoUrl
                        ? "Link digital disponivel"
                        : "Nenhum catalogo vinculado ainda")}
                  </p>
                  {revista.catalogoUrl ? (
                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={revista.catalogoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
                      >
                        Abrir catalogo
                      </a>
                      <a
                        href={buildCatalogWhatsAppShareLink(revista)}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-[color:var(--line)] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-white/80"
                      >
                        Compartilhar
                      </a>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(
                            buildCatalogShareText(revista),
                          );
                          setFeedback(
                            `Mensagem de compartilhamento copiada para ${revista.titulo} ${revista.edicao}.`,
                          );
                        }}
                        className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
                      >
                        Copiar mensagem
                      </button>
                    </div>
                  ) : (
                    <p className="mt-3 text-sm text-muted">Sem catalogo vinculado.</p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => startEditRevista(revista)}
                    className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRevista(revista.id)}
                    className="rounded-full border border-[#e7c9b8] bg-[#fff3ea] px-4 py-2 text-sm font-semibold text-warm transition hover:bg-[#ffe8d6]"
                  >
                    Remover
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="surface-card rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="eyebrow">Produtos</span>
                <h2 className="mt-2 font-display text-2xl">
                  {editingProdutoId ? "Editar produto" : "Novo produto"}
                </h2>
              </div>

            {editingProdutoId ? (
              <button
                type="button"
                onClick={resetProdutoForm}
                className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <form onSubmit={handleProdutoSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Revista
                <select
                  value={produtoDraft.revistaId}
                  onChange={(event) =>
                    updateProdutoDraft("revistaId", event.target.value)
                  }
                  className={inputClass}
                >
                  <option value="">Selecione uma revista</option>
                  {revistas.map((revista) => (
                    <option key={revista.id} value={revista.id}>
                      {revista.titulo} {revista.edicao}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-medium">
                Codigo
                <input
                  value={produtoDraft.codigo}
                  onChange={(event) =>
                    updateProdutoDraft("codigo", event.target.value)
                  }
                  placeholder="Ex.: AV-001"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Nome do produto
                <input
                  value={produtoDraft.nome}
                  onChange={(event) =>
                    updateProdutoDraft("nome", event.target.value)
                  }
                  placeholder="Ex.: Batom Matte Rosa"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Categoria
                <input
                  value={produtoDraft.categoria}
                  onChange={(event) =>
                    updateProdutoDraft("categoria", event.target.value)
                  }
                  placeholder="Ex.: Maquiagem"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium">
                Preco
                <input
                  value={produtoDraft.precoCatalogo}
                  onChange={(event) =>
                    updateProdutoDraft("precoCatalogo", event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="29.90"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Estoque
                <input
                  value={produtoDraft.estoqueAtual}
                  onChange={(event) =>
                    updateProdutoDraft("estoqueAtual", event.target.value)
                  }
                  inputMode="numeric"
                  placeholder="0"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Margem
                <input
                  value={produtoDraft.margemComissao}
                  onChange={(event) =>
                    updateProdutoDraft("margemComissao", event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="30"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="flex items-center gap-3 rounded-[18px] border border-[color:var(--line)] bg-white/65 px-4 py-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={produtoDraft.ativo}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  updateProdutoDraft("ativo", event.target.checked)
                }
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              Produto disponivel para venda
            </label>

            <button
              type="submit"
              disabled={isPending}
              className="rounded-full bg-[#1d1915] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
            >
              {editingProdutoId ? "Atualizar produto" : "Salvar produto"}
            </button>
          </form>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <span className="eyebrow">Lista</span>
              <h3 className="mt-1 text-lg font-semibold">Produtos</h3>
            </div>

            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por produto, codigo ou categoria"
              className="rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-3 text-sm outline-none transition focus:border-accent"
            />
          </div>

          <div className="mt-5 grid gap-4">
            {filteredProdutos.length ? (
              filteredProdutos.map((produto) => (
                <article
                  key={produto.id}
                  className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-5"
                >
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <p className="text-sm text-muted">
                        {produto.revistaTitulo} | {produto.codigo}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {produto.nome}
                      </h3>
                      <p className="mt-2 text-sm text-muted">
                        {produto.categoria}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                          produto.ativo === false
                            ? "bg-[#f4eee7] text-muted"
                            : "bg-[#e8faf6] text-accent"
                        }`}
                      >
                        {produto.ativo === false ? "inativo" : "ativo"}
                      </span>
                      <button
                        type="button"
                        onClick={() => startEditProduto(produto)}
                        className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => removeProduto(produto.id)}
                        className="rounded-full border border-[#e7c9b8] bg-[#fff3ea] px-4 py-2 text-sm font-semibold text-warm transition hover:bg-[#ffe8d6]"
                      >
                        Remover
                      </button>
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Preco
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(produto.precoCatalogo)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Estoque
                      </p>
                      <p className="mt-1 font-semibold">{produto.estoqueAtual}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Margem
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatPercent(produto.margemComissao ?? 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Categoria
                      </p>
                      <p className="mt-1 font-semibold">{produto.categoria}</p>
                    </div>
                  </div>
                </article>
              ))
          ) : (
              <div className="rounded-[24px] border border-dashed border-[color:var(--line)] p-8 text-center text-sm text-muted">
                Nenhum produto encontrado.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
