import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { requireAdminUser } from "@/lib/auth-admin";
import {
  buildComissaoShareLink,
  buildFinanceiroResumo,
} from "@/lib/financeiro";
import {
  formatCurrency,
  formatPercent,
  formatShortDate,
} from "@/lib/formatters";
import { getDashboardSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function FinanceiroPage() {
  await requireAdminUser();
  const snapshot = await getDashboardSnapshot();
  const financeiro = buildFinanceiroResumo(
    snapshot.pedidos,
    snapshot.vendedoras,
  );
  const prioridades = financeiro.ranking
    .filter((item) => item.pedidosEmAberto > 0 || item.comissaoEmAberto > 0)
    .slice(0, 3);

  const cards = [
    {
      label: "Comissao em aberto",
      value: formatCurrency(financeiro.totais.comissaoEmAberto),
    },
    {
      label: "Comissao paga",
      value: formatCurrency(financeiro.totais.comissaoPaga),
    },
    {
      label: "Faturamento mapeado",
      value: formatCurrency(financeiro.totais.faturamentoTotal),
    },
    {
      label: "Pedidos em aberto",
      value: financeiro.totais.pedidosEmAberto.toString(),
    },
  ];

  return (
    <AppShell
      eyebrow="Admin"
      title="Comissoes, pagamentos e prioridades"
      description="Financeiro e comissoes."
      badge={
        snapshot.supabaseReady
          ? "Supabase"
          : "Demonstracao"
      }
      actions={
        <>
          <Link
            href="/pedidos"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
          >
            Pedidos
          </Link>
          <Link
            href="/catalogo"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Catalogo
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

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <span className="eyebrow">Prioridades</span>
              <h2 className="mt-2 font-display text-2xl">Em aberto</h2>
            </div>
            <Link
              href="/vendedoras"
              className="text-sm font-semibold text-accent"
            >
              Abrir vendedoras
            </Link>
          </div>

          <div className="mt-6 grid gap-4">
            {prioridades.length ? (
              prioridades.map((item) => (
                <article
                  key={item.id}
                  className="rounded-[24px] border border-[color:var(--line)] bg-white/60 p-5"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-sm text-muted">Vendedora</p>
                      <h3 className="mt-1 text-xl font-semibold">{item.nome}</h3>
                      <p className="mt-2 text-sm text-muted">
                        Comissao base {formatPercent(item.percentualComissao)}
                      </p>
                    </div>

                    <div className="rounded-full bg-[#fff3e5] px-3 py-1 text-sm font-semibold text-warm">
                      {item.pedidosEmAberto} pedido(s) em aberto
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Em aberto
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(item.comissaoEmAberto)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Ja pago
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(item.comissaoPaga)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.16em] text-muted">
                        Ticket medio
                      </p>
                      <p className="mt-1 font-semibold">
                        {formatCurrency(item.ticketMedio)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <a
                      href={buildComissaoShareLink(item)}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full bg-[#1d1915] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                    >
                      Compartilhar no WhatsApp
                    </a>
                    <Link
                      href="/pedidos"
                      className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white"
                    >
                      Ajustar pedidos
                    </Link>
                  </div>
                </article>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-[color:var(--line)] p-6 text-sm text-muted">
                Nenhuma prioridade em aberto.
              </div>
            )}
          </div>
        </section>

        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <span className="eyebrow">Lista</span>
            <h2 className="font-display text-2xl">Por vendedora</h2>
          </div>

          <div className="mt-6 flex flex-col gap-4">
            {financeiro.ranking.map((item) => (
              <article
                key={item.id}
                className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{item.nome}</h3>
                    <p className="text-sm text-muted">
                      {item.pedidosEmAberto} aberto(s) | {item.pedidosPagos}{" "}
                      pago(s)
                    </p>
                  </div>

                  <div className="rounded-full bg-[#e8faf6] px-3 py-1 text-sm font-semibold text-accent">
                    {formatCurrency(item.comissaoEmAberto)} em aberto
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Vendido
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(item.valorEmAberto + item.valorPago)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Ticket medio
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatCurrency(item.ticketMedio)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.16em] text-muted">
                      Ultimo pedido
                    </p>
                    <p className="mt-1 font-semibold">
                      {item.ultimoPedidoEm
                        ? formatShortDate(item.ultimoPedidoEm)
                        : "Sem pedidos"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
