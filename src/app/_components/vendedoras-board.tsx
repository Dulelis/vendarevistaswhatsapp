"use client";

import { useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  useDeferredValue,
  useMemo,
  useState,
  useTransition,
} from "react";
import {
  deleteVendedoraAction,
  saveVendedoraAction,
} from "@/app/vendedoras/actions";
import {
  formatCurrency,
  formatPercent,
  formatPhone,
  formatShortDate,
} from "@/lib/formatters";
import type { Vendedora } from "@/lib/types";

const STORAGE_KEY = "vende-revistas:vendedoras";

type DraftState = {
  nome: string;
  email: string;
  whatsapp: string;
  telefone: string;
  percentualComissao: string;
  cidade: string;
  observacoes: string;
  ativa: boolean;
};

const EMPTY_DRAFT: DraftState = {
  nome: "",
  email: "",
  whatsapp: "",
  telefone: "",
  percentualComissao: "20",
  cidade: "",
  observacoes: "",
  ativa: true,
};

function createId() {
  if (
    typeof globalThis.crypto !== "undefined" &&
    typeof globalThis.crypto.randomUUID === "function"
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `local-${Date.now()}`;
}

function createLocalVendedora(
  draft: DraftState,
  overrides?: Partial<Vendedora>,
): Vendedora {
  const whatsapp = draft.whatsapp.trim();

  return {
    id: overrides?.id ?? createId(),
    nome: draft.nome.trim(),
    email: draft.email.trim().toLowerCase() || undefined,
    whatsapp,
    telefone: draft.telefone.trim() || whatsapp,
    percentualComissao: Number(draft.percentualComissao),
    cidade: draft.cidade.trim() || "Sem cidade definida",
    ativa: draft.ativa,
    observacoes: draft.observacoes.trim(),
    totalMes: overrides?.totalMes ?? 0,
    pedidosPendentes: overrides?.pedidosPendentes ?? 0,
    ultimaVendaEm: overrides?.ultimaVendaEm ?? new Date().toISOString(),
    revistasAtivas: overrides?.revistasAtivas ?? [],
  };
}

function toDraft(vendedora: Vendedora): DraftState {
  return {
    nome: vendedora.nome,
    email: vendedora.email ?? "",
    whatsapp: vendedora.whatsapp,
    telefone: vendedora.telefone,
    percentualComissao: String(vendedora.percentualComissao),
    cidade: vendedora.cidade,
    observacoes: vendedora.observacoes ?? "",
    ativa: vendedora.ativa,
  };
}

function readLocalSeed(initialVendedoras: Vendedora[]) {
  if (typeof window === "undefined") {
    return initialVendedoras;
  }

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return initialVendedoras;
    }

    const parsed = JSON.parse(saved);

    return Array.isArray(parsed) ? (parsed as Vendedora[]) : initialVendedoras;
  } catch {
    return initialVendedoras;
  }
}

export function VendedorasBoard({
  initialVendedoras,
  dataSource,
}: {
  initialVendedoras: Vendedora[];
  dataSource: "local" | "supabase";
}) {
  const router = useRouter();
  const isSupabaseMode = dataSource === "supabase";
  const [localVendedoras, setLocalVendedoras] = useState(() =>
    isSupabaseMode ? initialVendedoras : readLocalSeed(initialVendedoras),
  );
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState(
    isSupabaseMode
      ? "Cadastros conectados ao Supabase."
      : "Cadastros salvos no navegador.",
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "todas" | "ativas" | "pausadas"
  >("todas");
  const [isPending, startTransition] = useTransition();
  const deferredSearch = useDeferredValue(searchTerm);

  const vendedoras = isSupabaseMode ? initialVendedoras : localVendedoras;

  const filtered = useMemo(() => {
    return vendedoras.filter((item) => {
      const query = deferredSearch.trim().toLowerCase();
      const matchesSearch =
        !query ||
        `${item.nome} ${item.email ?? ""} ${item.cidade} ${item.whatsapp}`
          .toLowerCase()
          .includes(query);
      const matchesStatus =
        statusFilter === "todas" ||
        (statusFilter === "ativas" ? item.ativa : !item.ativa);

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearch, statusFilter, vendedoras]);

  const totalAtivas = vendedoras.filter((item) => item.ativa).length;
  const percentualMedio = vendedoras.length
    ? vendedoras.reduce((sum, item) => sum + item.percentualComissao, 0) /
      vendedoras.length
    : 0;
  const faturamentoMapeado = vendedoras.reduce(
    (sum, item) => sum + item.totalMes,
    0,
  );

  function handleFieldChange<Field extends keyof DraftState>(
    field: Field,
    value: DraftState[Field],
  ) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleToggle(event: ChangeEvent<HTMLInputElement>) {
    handleFieldChange("ativa", event.target.checked);
  }

  function resetForm() {
    setDraft(EMPTY_DRAFT);
    setEditingId(null);
  }

  function persistLocalVendedoras(nextVendedoras: Vendedora[]) {
    setLocalVendedoras(nextVendedoras);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextVendedoras));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nome = draft.nome.trim();
    const whatsapp = draft.whatsapp.trim();
    const percentualComissao = Number(draft.percentualComissao);

    if (!nome || !whatsapp) {
      setFeedback("Preencha ao menos nome e WhatsApp da vendedora.");
      return;
    }

    if (Number.isNaN(percentualComissao) || percentualComissao <= 0) {
      setFeedback("Informe um percentual de comissao valido.");
      return;
    }

    startTransition(async () => {
      if (isSupabaseMode) {
        const result = await saveVendedoraAction({
          id: editingId ?? undefined,
          nome,
          email: draft.email.trim().toLowerCase(),
          whatsapp,
          telefone: draft.telefone.trim() || whatsapp,
          percentualComissao,
          cidade: draft.cidade.trim() || "Sem cidade definida",
          observacoes: draft.observacoes.trim(),
          ativa: draft.ativa,
        });

        setFeedback(result.message);

        if (result.ok) {
          resetForm();
          router.refresh();
        }

        return;
      }

      const nextVendedora = createLocalVendedora(draft);

      if (editingId) {
        const currentItem = vendedoras.find((item) => item.id === editingId);

        if (!currentItem) {
          setFeedback("Nao encontrei a vendedora para atualizar.");
          return;
        }

        const nextVendedoras = vendedoras.map((item) =>
          item.id === editingId
            ? createLocalVendedora(draft, {
                id: item.id,
                totalMes: item.totalMes,
                pedidosPendentes: item.pedidosPendentes,
                ultimaVendaEm: item.ultimaVendaEm,
                revistasAtivas: item.revistasAtivas,
              })
            : item,
        );

        persistLocalVendedoras(nextVendedoras);
        setFeedback(`${currentItem.nome} foi atualizada com sucesso.`);
      } else {
        persistLocalVendedoras([nextVendedora, ...vendedoras]);
        setFeedback(`${nextVendedora.nome} foi adicionada ao cadastro prototipo.`);
      }

      resetForm();
    });
  }

  function startEdit(vendedora: Vendedora) {
    setEditingId(vendedora.id);
    setDraft(toDraft(vendedora));
    setFeedback(
      isSupabaseMode
        ? `Editando ${vendedora.nome}. Ao salvar, eu atualizo o Supabase e recarrego a lista.`
        : `Editando ${vendedora.nome}. As mudancas continuam locais ate conectarmos o banco.`,
    );
  }

  function removeVendedora(id: string) {
    startTransition(async () => {
      if (isSupabaseMode) {
        const result = await deleteVendedoraAction(id);
        setFeedback(result.message);

        if (result.ok) {
          if (editingId === id) {
            resetForm();
          }

          router.refresh();
        }

        return;
      }

      const nextVendedoras = vendedoras.filter((item) => item.id !== id);
      persistLocalVendedoras(nextVendedoras);

      if (editingId === id) {
        resetForm();
      }

      setFeedback("Cadastro removido do prototipo local.");
    });
  }

  function restoreSeed() {
    startTransition(() => {
      if (isSupabaseMode) {
        router.refresh();
        setFeedback("Lista atualizada com a versao mais recente do Supabase.");
        return;
      }

      persistLocalVendedoras(initialVendedoras);
      resetForm();
      setFeedback("Cadastros de demonstracao restaurados.");
    });
  }

  const inputClass =
    "mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-accent focus:bg-white";

  return (
    <div className="grid gap-6">
      <div className="grid gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div>
            <span className="eyebrow">Resumo</span>
            <h2 className="mt-2 font-display text-2xl">Base comercial</h2>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
              <p className="text-sm text-muted">Vendedoras ativas</p>
              <p className="mt-2 font-display text-3xl">{totalAtivas}</p>
            </article>
            <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
              <p className="text-sm text-muted">Comissao media</p>
              <p className="mt-2 font-display text-3xl">
                {formatPercent(percentualMedio)}
              </p>
            </article>
            <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
              <p className="text-sm text-muted">Faturamento mapeado</p>
              <p className="mt-2 font-display text-3xl">
                {formatCurrency(faturamentoMapeado)}
              </p>
            </article>
          </div>

          <div className="mt-6 rounded-[20px] border border-dashed border-[color:var(--line)] bg-[#fef7ef] p-4 text-sm text-muted">
            <p className="font-semibold text-foreground">Status</p>
            <p className="mt-1">{feedback}</p>
          </div>
        </section>

        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Cadastro</span>
              <h2 className="mt-2 font-display text-2xl">
                {editingId ? "Editar vendedora" : "Nova vendedora"}
              </h2>
            </div>

            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
              >
                Cancelar
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">
                Nome
                <input
                  value={draft.nome}
                  onChange={(event) =>
                    handleFieldChange("nome", event.target.value)
                  }
                  placeholder="Ex.: Ana Souza"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Email de acesso
                <input
                  value={draft.email}
                  onChange={(event) =>
                    handleFieldChange("email", event.target.value)
                  }
                  type="email"
                  placeholder="ana@revistas.app"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                WhatsApp
                <input
                  value={draft.whatsapp}
                  onChange={(event) =>
                    handleFieldChange("whatsapp", event.target.value)
                  }
                  placeholder="55 11 99999-9999"
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="text-sm font-medium">
                Telefone
                <input
                  value={draft.telefone}
                  onChange={(event) =>
                    handleFieldChange("telefone", event.target.value)
                  }
                  placeholder="Opcional"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                Cidade
                <input
                  value={draft.cidade}
                  onChange={(event) =>
                    handleFieldChange("cidade", event.target.value)
                  }
                  placeholder="Ex.: Osasco"
                  className={inputClass}
                />
              </label>

              <label className="text-sm font-medium">
                % comissao
                <input
                  value={draft.percentualComissao}
                  onChange={(event) =>
                    handleFieldChange("percentualComissao", event.target.value)
                  }
                  inputMode="decimal"
                  placeholder="20"
                  className={inputClass}
                />
              </label>
            </div>

            <label className="text-sm font-medium">
              Observacoes
              <textarea
                value={draft.observacoes}
                onChange={(event) =>
                  handleFieldChange("observacoes", event.target.value)
                }
                rows={4}
                placeholder="Anote preferencias, regra especial de comissao ou observacoes da operacao."
                className={`${inputClass} resize-none`}
              />
            </label>

            <label className="flex items-center gap-3 rounded-[18px] border border-[color:var(--line)] bg-white/65 px-4 py-3 text-sm font-medium">
              <input
                type="checkbox"
                checked={draft.ativa}
                onChange={handleToggle}
                className="h-4 w-4 accent-[color:var(--accent)]"
              />
              Vendedora ativa na operacao
            </label>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="submit"
                disabled={isPending}
                className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
              >
                {editingId ? "Atualizar cadastro" : "Salvar vendedora"}
              </button>
              <button
                type="button"
                onClick={restoreSeed}
                className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-semibold transition hover:bg-white/70"
              >
                {isSupabaseMode ? "Atualizar lista" : "Restaurar demonstracao"}
              </button>
            </div>
          </form>
        </section>
      </div>

      <section className="surface-card rounded-[28px] p-6 sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="eyebrow">Base comercial</span>
            <h2 className="mt-2 font-display text-2xl">
              Lista de vendedoras
            </h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Buscar por nome, cidade ou WhatsApp"
              className="rounded-full border border-[color:var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-accent"
            />

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value as "todas" | "ativas" | "pausadas",
                )
              }
              className="rounded-full border border-[color:var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-accent"
            >
              <option value="todas">Todas</option>
              <option value="ativas">Apenas ativas</option>
              <option value="pausadas">Apenas pausadas</option>
            </select>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          {filtered.length ? (
            filtered.map((vendedora) => (
              <article
                key={vendedora.id}
                className="rounded-[24px] border border-[color:var(--line)] bg-white/60 p-5"
              >
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold">
                        {vendedora.nome}
                      </h3>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] ${
                          vendedora.ativa
                            ? "bg-[#e8faf6] text-accent"
                            : "bg-[#f4eee7] text-muted"
                        }`}
                      >
                        {vendedora.ativa ? "ativa" : "pausada"}
                      </span>
                    </div>

              <p className="text-sm text-muted">
                {vendedora.cidade} | {formatPhone(vendedora.whatsapp)}
              </p>
              <p className="text-sm text-muted">
                Acesso: {vendedora.email || "Sem email de acesso"}
              </p>
              <p className="text-sm text-muted">
                Telefone de apoio: {formatPhone(vendedora.telefone)}
              </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => startEdit(vendedora)}
                      className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => removeVendedora(vendedora.id)}
                      className="rounded-full border border-[#e7c9b8] bg-[#fff3ea] px-4 py-2 text-sm font-semibold text-warm transition hover:bg-[#ffe8d6]"
                    >
                      Remover
                    </button>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Comissao
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatPercent(vendedora.percentualComissao)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Total no mes
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(vendedora.totalMes)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Pendencias
                    </p>
                    <p className="mt-1 font-semibold">
                      {vendedora.pedidosPendentes} pedidos
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Ultima venda
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatShortDate(vendedora.ultimaVendaEm)}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {vendedora.revistasAtivas.length ? (
                    vendedora.revistasAtivas.map((revista) => (
                      <span
                        key={revista}
                        className="rounded-full bg-[#f5efe5] px-3 py-1 text-xs font-semibold text-muted"
                      >
                        {revista}
                      </span>
                    ))
                  ) : (
                    <span className="rounded-full bg-[#f5efe5] px-3 py-1 text-xs font-semibold text-muted">
                      Sem revista ativa definida
                    </span>
                  )}
                </div>

                {vendedora.observacoes ? (
                  <p className="mt-4 rounded-[18px] border border-dashed border-[color:var(--line)] p-4 text-sm leading-6 text-muted">
                    {vendedora.observacoes}
                  </p>
                ) : null}
              </article>
            ))
          ) : (
            <div className="rounded-[24px] border border-dashed border-[color:var(--line)] p-8 text-center text-sm text-muted">
              Nenhuma vendedora encontrada.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
