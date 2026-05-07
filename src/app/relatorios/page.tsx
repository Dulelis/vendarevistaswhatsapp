import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { requireAdminUser } from "@/lib/auth-admin";
import { getDashboardSnapshot } from "@/lib/data";
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
} from "@/lib/formatters";
import { buildRelatorioMensal } from "@/lib/relatorios";

export const dynamic = "force-dynamic";

export default async function RelatoriosPage() {
  await requireAdminUser();
  const snapshot = await getDashboardSnapshot();
  const relatorio = buildRelatorioMensal(
    snapshot.pedidos,
    snapshot.vendedoras,
    snapshot.produtos,
    snapshot.revistas,
  );
  const cards = [
    {
      label: "Faturamento total",
      value: formatCurrency(relatorio.totais.faturamento),
    },
    {
      label: "Comissao em aberto",
      value: formatCurrency(relatorio.totais.comissaoEmAberto),
    },
    {
      label: "Ticket medio",
      value: formatCurrency(relatorio.totais.ticketMedio),
    },
    {
      label: "Unidades vendidas",
      value: relatorio.totais.unidadesVendidas.toString(),
    },
  ];

  return (
    <AppShell
      eyebrow="Admin"
      title="Fechamento mensal e leitura da campanha"
      description="Relatorios e fechamento."
      badge={
        snapshot.supabaseReady
          ? "Supabase"
          : "Demonstracao"
      }
      actions={
        <>
          <Link
            href="/financeiro"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
          >
            Financeiro
          </Link>
          <Link
            href="/vendedora"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Preview
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <article
            key={card.label}
            className="surface-card rounded-[24px] p-5 sm:p-6"
          >
            <p className="text-sm text-muted">{card.label}</p>
            <p className="mt-3 font-display text-3xl">{card.value}</p>
          </article>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Checklist</span>
            <h2 className="font-display text-2xl">Fechamento</h2>
          </div>

          <div className="mt-6 grid gap-3">
            {relatorio.checklist.map((item) => (
              <div
                key={item}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4 text-sm leading-6 text-muted"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-[22px] border border-[color:var(--line)] bg-[#eef8f4] p-4">
              <p className="text-sm text-muted">Pedidos pagos</p>
              <p className="mt-2 font-display text-3xl">
                {relatorio.totais.pedidosPagos}
              </p>
            </article>
            <article className="rounded-[22px] border border-[color:var(--line)] bg-[#fff4ea] p-4">
              <p className="text-sm text-muted">Pedidos em aberto</p>
              <p className="mt-2 font-display text-3xl">
                {relatorio.totais.pedidosEmAberto}
              </p>
            </article>
            <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
              <p className="text-sm text-muted">Comissao paga</p>
              <p className="mt-2 font-display text-3xl">
                {formatCurrency(relatorio.totais.comissaoPaga)}
              </p>
            </article>
            <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
              <p className="text-sm text-muted">Estoque critico</p>
              <p className="mt-2 font-display text-3xl">
                {relatorio.totais.estoqueCritico}
              </p>
            </article>
          </div>
        </section>

        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Timeline</span>
            <h2 className="font-display text-2xl">Pedidos</h2>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {relatorio.timeline.length ? (
              relatorio.timeline.map((item) => (
                <article
                  key={item.data}
                  className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-muted">
                        {formatShortDate(item.data)}
                      </p>
                      <h3 className="mt-1 text-lg font-semibold">
                        {item.pedidos} pedido(s)
                      </h3>
                    </div>
                    <div className="rounded-full bg-[#1d1915] px-3 py-1 text-sm font-semibold text-white">
                      {formatCurrency(item.faturamento)}
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-muted">
                    Comissao gerada: {formatCurrency(item.comissao)}
                  </p>
                </article>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[color:var(--line)] p-6 text-sm text-muted">
                Sem dados para timeline.
              </div>
            )}
          </div>
        </section>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Ranking</span>
              <h2 className="mt-2 font-display text-2xl">Revistas</h2>
            </div>
            <Link href="/catalogo" className="text-sm font-semibold text-accent">
              Abrir catalogo
            </Link>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {relatorio.rankingRevistas.length ? (
              relatorio.rankingRevistas.map((item) => (
                <article
                  key={item.label}
                  className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{item.label}</h3>
                      <p className="text-sm text-muted">
                        {item.unidades} unidade(s) | {item.pedidos} lancamento(s)
                      </p>
                    </div>

                    <div
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${
                        item.ativa
                          ? "bg-[#e8faf6] text-accent"
                          : "bg-[#f4eee7] text-muted"
                      }`}
                    >
                      {item.ativa ? "campanha ativa" : "campanha encerrada"}
                    </div>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Faturamento
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(item.faturamento)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Comissao gerada
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(item.comissao)}
                      </p>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[22px] border border-dashed border-[color:var(--line)] p-6 text-sm text-muted">
                Nenhuma revista no relatorio.
              </div>
            )}
          </div>
        </section>

        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Categorias</span>
              <h2 className="mt-2 font-display text-2xl">Resumo</h2>
            </div>
            <Link
              href="/financeiro"
              className="text-sm font-semibold text-accent"
            >
              Ver financeiro
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {relatorio.rankingCategorias.slice(0, 4).map((item) => (
              <article
                key={item.label}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-lg font-semibold">{item.label}</h3>
                    <p className="text-sm text-muted">
                      {item.unidades} unidade(s) vendidas
                    </p>
                  </div>
                  <div className="rounded-full bg-[#fff4ea] px-3 py-1 text-sm font-semibold text-warm">
                    {formatCurrency(item.faturamento)}
                  </div>
                </div>
              </article>
            ))}

            <div className="rounded-[22px] border border-[color:var(--line)] bg-[#f7f1e7] p-5">
              <p className="text-sm font-semibold text-muted">
                Melhor comissao em aberto
              </p>
              <h3 className="mt-2 text-xl font-semibold">
                {relatorio.rankingVendedoras[0]?.nome ?? "Sem dados ainda"}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {relatorio.rankingVendedoras[0]
                  ? `${formatCurrency(relatorio.rankingVendedoras[0].comissaoEmAberto)} em aberto com comissao base ${formatPercent(relatorio.rankingVendedoras[0].percentualComissao)}.`
                  : "Quando os pedidos entrarem, o relatorio mostra aqui quem lidera o fechamento."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
