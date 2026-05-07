import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { requireAdminUser } from "@/lib/auth-admin";
import { buildCatalogWhatsAppShareLink } from "@/lib/catalogo-share";
import { getDashboardSnapshot } from "@/lib/data";
import {
  formatCurrency,
  formatPercent,
  formatPhone,
  formatShortDate,
} from "@/lib/formatters";
import { buildPortalVendedoraData } from "@/lib/portal-vendedora";

type VendedoraPageProps = {
  searchParams?: Promise<{
    id?: string;
  }>;
};

export const dynamic = "force-dynamic";

export default async function VendedoraPage({
  searchParams,
}: VendedoraPageProps) {
  await requireAdminUser();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const snapshot = await getDashboardSnapshot();
  const portal = buildPortalVendedoraData(
    snapshot.vendedoras,
    snapshot.revistas,
    snapshot.pedidos,
    resolvedSearchParams?.id,
  );

  return (
    <AppShell
      eyebrow="Preview"
      title="Area da vendedora"
      description="Visao simplificada da vendedora."
      badge="Sem bloqueio de perfil"
      actions={
        <>
          <Link
            href="/relatorios"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
          >
            Relatorios
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
      {portal.selecionada ? (
        <div className="grid gap-6">
          <section className="surface-card rounded-[28px] p-6 sm:p-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <span className="eyebrow">Minha area</span>
                <h2 className="mt-2 font-display text-3xl">
                  {portal.selecionada.nome}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                  {portal.selecionada.cidade} |{" "}
                  {formatPhone(portal.selecionada.whatsapp)} | comissao base{" "}
                  {formatPercent(portal.selecionada.percentualComissao)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                {portal.opcoes.map((item) => (
                  <Link
                    key={item.id}
                    href={`/vendedora?id=${item.id}`}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      item.id === portal.selecionada?.id
                        ? "bg-[#1d1915] text-white"
                        : "border border-[color:var(--line)] bg-white/75 hover:bg-white"
                    }`}
                  >
                    {item.nome}
                  </Link>
                ))}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
                <p className="text-sm text-muted">Total vendido</p>
                <p className="mt-2 font-display text-3xl">
                  {formatCurrency(portal.totais.totalVendido)}
                </p>
              </article>
              <article className="rounded-[22px] border border-[color:var(--line)] bg-[#fff4ea] p-4">
                <p className="text-sm text-muted">Comissao em aberto</p>
                <p className="mt-2 font-display text-3xl">
                  {formatCurrency(portal.totais.comissaoEmAberto)}
                </p>
              </article>
              <article className="rounded-[22px] border border-[color:var(--line)] bg-[#eef8f4] p-4">
                <p className="text-sm text-muted">Pedidos em aberto</p>
                <p className="mt-2 font-display text-3xl">
                  {portal.totais.pedidosEmAberto}
                </p>
              </article>
              <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
                <p className="text-sm text-muted">Ticket medio</p>
                <p className="mt-2 font-display text-3xl">
                  {formatCurrency(portal.totais.ticketMedio)}
                </p>
              </article>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
            <section className="surface-card rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="eyebrow">Catalogos ativos</span>
                  <h2 className="mt-2 font-display text-2xl">
                    Materiais para compartilhar
                  </h2>
                </div>
                <Link
                  href="/catalogo"
                  className="text-sm font-semibold text-accent"
                >
                  Abrir catalogo
                </Link>
              </div>

              <div className="mt-6 flex flex-col gap-4">
                {portal.revistas.length ? (
                  portal.revistas.map((revista) => (
                    <article
                      key={revista.id}
                      className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {revista.titulo} {revista.edicao}
                          </h3>
                          <p className="text-sm text-muted">
                            Vigencia ate {formatShortDate(revista.vigenciaFim)}
                          </p>
                        </div>

                        <div className="rounded-full bg-[#e8faf6] px-3 py-1 text-sm font-semibold text-accent">
                          Margem {formatPercent(revista.margemPadrao)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {revista.catalogoUrl ? (
                          <a
                            href={revista.catalogoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white"
                          >
                            Abrir catalogo
                          </a>
                        ) : null}
                        <a
                          href={buildCatalogWhatsAppShareLink(revista)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-[#1d1915] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                        >
                          Compartilhar
                        </a>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[22px] border border-dashed border-[color:var(--line)] p-6 text-sm text-muted">
                    Ainda nao existem catalogos vinculados para essa vendedora.
                  </div>
                )}
              </div>
            </section>

            <section className="surface-card rounded-[28px] p-6 sm:p-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="eyebrow">Minha comissao</span>
                  <h2 className="mt-2 font-display text-2xl">
                    Leitura rapida do periodo
                  </h2>
                </div>
                <Link
                  href="/financeiro"
                  className="text-sm font-semibold text-accent"
                >
                  Ver no admin
                </Link>
              </div>

              <div className="mt-6 grid gap-4">
                <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
                  <p className="text-sm text-muted">Comissao a receber</p>
                  <p className="mt-2 font-display text-3xl">
                    {formatCurrency(portal.totais.comissaoEmAberto)}
                  </p>
                </article>
                <article className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4">
                  <p className="text-sm text-muted">Comissao ja paga</p>
                  <p className="mt-2 font-display text-3xl">
                    {formatCurrency(portal.totais.comissaoPaga)}
                  </p>
                </article>
                <article className="rounded-[22px] border border-[color:var(--line)] bg-[#f7f1e7] p-4">
                  <p className="text-sm text-muted">Pedidos pagos</p>
                  <p className="mt-2 font-display text-3xl">
                    {portal.totais.pedidosPagos}
                  </p>
                </article>
              </div>
            </section>
          </div>

          <section className="surface-card rounded-[28px] p-6 sm:p-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="eyebrow">Meus pedidos</span>
                <h2 className="mt-2 font-display text-2xl">
                  Historico do que ja foi enviado
                </h2>
              </div>
              <Link href="/pedidos" className="text-sm font-semibold text-accent">
                Abrir pedidos
              </Link>
            </div>

            <div className="mt-6 flex flex-col gap-4">
              {portal.pedidos.length ? (
                portal.pedidos.map((pedido) => (
                  <article
                    key={pedido.id}
                    className="rounded-[22px] border border-[color:var(--line)] bg-white/60 p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm text-muted">{pedido.codigo}</p>
                        <h3 className="mt-1 text-lg font-semibold">
                          {pedido.itens.length} item(ns) no pedido
                        </h3>
                        <p className="mt-2 text-sm text-muted">
                          {formatShortDate(pedido.criadoEm)}
                        </p>
                      </div>

                      <div className="rounded-full bg-[#eef8f4] px-3 py-1 text-sm font-semibold text-accent">
                        {pedido.status}
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 sm:grid-cols-3">
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
                          Itens
                        </p>
                        <p className="mt-1 font-semibold">
                          {pedido.itens
                            .map((item) => `${item.produtoNome} ${item.quantidade}x`)
                            .join(", ")}
                        </p>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-[color:var(--line)] p-6 text-sm text-muted">
                  Essa vendedora ainda nao tem pedidos registrados no sistema.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : (
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <span className="eyebrow">Sem dados</span>
          <h2 className="mt-2 font-display text-2xl">
            Ainda nao existe vendedora cadastrada
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
            Cadastre a primeira vendedora no admin para eu montar aqui a visao
            simplificada da area dela.
          </p>
        </section>
      )}
    </AppShell>
  );
}
