import Link from "next/link";
import { redirect } from "next/navigation";
import { MinhaAreaOrderBuilder } from "../_components/minha-area-order-builder";
import { SellerShell } from "../_components/seller-shell";
import { buildCatalogWhatsAppShareLink } from "@/lib/catalogo-share";
import { getDashboardSnapshot } from "@/lib/data";
import { getAuthenticatedVendedora } from "@/lib/auth-vendedora";
import {
  buildPortalVendedoraData,
  filterProdutosDisponiveisParaVendedora,
} from "@/lib/portal-vendedora";
import {
  formatCurrency,
  formatPercent,
  formatPhone,
  formatShortDate,
} from "@/lib/formatters";
import { buildWhatsAppOrderLink } from "@/lib/whatsapp";
import { logoutVendedoraAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function MinhaAreaPage({
  searchParams,
}: {
  searchParams: Promise<{
    revista?: string | string[];
    item?: string | string[];
  }>;
}) {
  const { vendedora } = await getAuthenticatedVendedora();
  const resolvedSearchParams = await searchParams;
  const revistaSelecionadaId =
    typeof resolvedSearchParams.revista === "string"
      ? resolvedSearchParams.revista
      : undefined;
  const produtoSelecionadoId =
    typeof resolvedSearchParams.item === "string"
      ? resolvedSearchParams.item
      : undefined;

  if (!vendedora || !vendedora.ativa) {
    redirect("/login-vendedora?erro=sem-acesso");
  }

  const snapshot = await getDashboardSnapshot();
  const portal = buildPortalVendedoraData(
    snapshot.vendedoras,
    snapshot.revistas,
    snapshot.pedidos,
    vendedora.id,
  );

  if (!portal.selecionada) {
    redirect("/login-vendedora?erro=sem-acesso");
  }

  const produtosDaVendedora = filterProdutosDisponiveisParaVendedora(
    snapshot.produtos,
    portal.revistas,
  );

  return (
    <SellerShell
      eyebrow="Minha area"
      title={`Oi, ${portal.selecionada?.nome ?? "vendedora"}`}
      description="Aqui fica a visao da propria vendedora: materiais para compartilhar, pedido pronto para sair pelo WhatsApp e leitura rapida da propria comissao."
      badge="Area autenticada da vendedora"
      navigationItems={[
        { href: "/minha-area", label: "Minha area" },
        { href: "/login-vendedora", label: "Novo acesso" },
      ]}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login-vendedora"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Novo acesso
          </Link>
          <form action={logoutVendedoraAction}>
            <button
              type="submit"
              className="rounded-full bg-[#fff7ed] px-5 py-3 text-sm font-semibold text-[#115e59] transition hover:bg-white"
            >
              Sair
            </button>
          </form>
        </div>
      }
    >
      <div className="grid gap-6">
        <section className="overflow-hidden rounded-[30px] border border-[#e4d3b8] bg-[#fffaf4] shadow-[0_22px_70px_rgba(116,76,28,0.1)]">
          <div className="bg-[linear-gradient(135deg,#0f766e_0%,#115e59_48%,#f59e0b_100%)] px-6 py-6 text-white sm:px-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div>
                <span className="text-xs uppercase tracking-[0.22em] text-white/80">
                  Minha area
                </span>
                <h2 className="mt-2 font-display text-3xl">
                  {portal.selecionada?.nome}
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85 sm:text-base">
                  {portal.selecionada?.cidade} |{" "}
                  {formatPhone(portal.selecionada?.whatsapp ?? "")} | comissao base{" "}
                  {formatPercent(portal.selecionada?.percentualComissao ?? 0)}
                </p>
                <p className="mt-2 text-sm text-white/75">
                  Email de acesso: {portal.selecionada?.email ?? "Nao informado"}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="#montar-pedido"
                  className="rounded-full bg-[#fff7ed] px-4 py-2 text-sm font-semibold text-[#115e59] transition hover:bg-white"
                >
                  Montar pedido
                </a>
                {portal.revistas.slice(0, 2).map((revista) => (
                  <a
                    key={revista.id}
                    href={buildCatalogWhatsAppShareLink(revista)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-white/20 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/25"
                  >
                    Compartilhar {revista.titulo}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div className="soft-grid px-6 py-6 sm:px-8">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <a
                href="#meus-pedidos"
                className="rounded-[24px] border border-[#dbeee8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:shadow-[0_20px_40px_rgba(15,118,110,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                  Total vendido
                </p>
                <p className="mt-3 font-display text-3xl">
                  {formatCurrency(portal.totais.totalVendido)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Tudo o que voce ja movimentou no periodo.
                </p>
                <p className="mt-4 text-sm font-semibold text-accent">
                  Ver pedidos que formaram esse total
                </p>
              </a>
              <a
                href="#minha-comissao"
                className="rounded-[24px] border border-[#f3ddbf] bg-[#fff8ee] p-4 transition hover:-translate-y-0.5 hover:border-[#b45309] hover:shadow-[0_20px_40px_rgba(180,83,9,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#b45309]">
                  Comissao em aberto
                </p>
                <p className="mt-3 font-display text-3xl">
                  {formatCurrency(portal.totais.comissaoEmAberto)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Valor que ainda aguarda fechamento.
                </p>
                <p className="mt-4 text-sm font-semibold text-[#b45309]">
                  Abrir leitura da comissao
                </p>
              </a>
              <a
                href="#meus-pedidos"
                className="rounded-[24px] border border-[#dbeee8] bg-[#ecfdf5] p-4 transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:shadow-[0_20px_40px_rgba(15,118,110,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                  Pedidos em aberto
                </p>
                <p className="mt-3 font-display text-3xl">
                  {portal.totais.pedidosEmAberto}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Pedidos que ainda seguem em andamento.
                </p>
                <p className="mt-4 text-sm font-semibold text-accent">
                  Acompanhar pedidos pendentes
                </p>
              </a>
              <a
                href="#montar-pedido"
                className="rounded-[24px] border border-[#dbeee8] bg-white p-4 transition hover:-translate-y-0.5 hover:border-[#0f766e] hover:shadow-[0_20px_40px_rgba(15,118,110,0.08)]"
              >
                <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                  Ticket medio
                </p>
                <p className="mt-3 font-display text-3xl">
                  {formatCurrency(portal.totais.ticketMedio)}
                </p>
                <p className="mt-2 text-sm text-muted">
                  Media de valor por pedido seu.
                </p>
                <p className="mt-4 text-sm font-semibold text-accent">
                  Montar novo pedido com esse ritmo
                </p>
              </a>
            </div>
          </div>
        </section>

        <MinhaAreaOrderBuilder
          pedidosRecentes={portal.pedidos}
          produtos={produtosDaVendedora}
          vendedora={portal.selecionada}
          whatsappDestino={snapshot.whatsappDestino}
          initialRevistaId={revistaSelecionadaId}
          initialProdutoId={produtoSelecionadoId}
        />

        <section className="grid gap-4 md:grid-cols-3">
          <a
            href="#montar-pedido"
            className="rounded-[28px] border border-[#dbeee8] bg-white/85 p-5 shadow-[0_20px_60px_rgba(15,118,110,0.08)] transition hover:-translate-y-1 hover:border-[#0f766e]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
              Montar pedido
            </p>
            <h3 className="mt-2 text-xl font-semibold">WhatsApp ja estruturado</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              A propria vendedora monta o mix, revisa o texto e abre a conversa pronta.
            </p>
            <p className="mt-4 text-sm font-semibold text-accent">
              Abrir montagem agora
            </p>
          </a>

          <a
            href="#minha-comissao"
            className="rounded-[28px] border border-[#f3ddbf] bg-[#fff8ee] p-5 shadow-[0_20px_60px_rgba(180,83,9,0.08)] transition hover:-translate-y-1 hover:border-[#b45309]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#b45309]">
              Sua leitura
            </p>
            <h3 className="mt-2 text-xl font-semibold">Comissao clara</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Voce acompanha o que esta pago e o que ainda esta em aberto.
            </p>
            <p className="mt-4 text-sm font-semibold text-[#b45309]">
              Ver minha comissao
            </p>
          </a>

          <a
            href="#meus-pedidos"
            className="rounded-[28px] border border-[#dbeee8] bg-[#ecfdf5] p-5 shadow-[0_20px_60px_rgba(15,118,110,0.08)] transition hover:-translate-y-1 hover:border-[#0f766e]"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
              Historico
            </p>
            <h3 className="mt-2 text-xl font-semibold">Pedidos do periodo</h3>
            <p className="mt-3 text-sm leading-6 text-muted">
              Fica facil lembrar o que ja entrou e o status de cada envio.
            </p>
            <p className="mt-4 text-sm font-semibold text-accent">
              Abrir historico completo
            </p>
          </a>
        </section>

        <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
          <section
            id="catalogos-ativos"
            className="overflow-hidden rounded-[30px] border border-[#e4d3b8] bg-[#fffaf4] shadow-[0_22px_70px_rgba(116,76,28,0.1)]"
          >
            <div className="border-b border-[#f1e0c8] bg-[linear-gradient(135deg,#fff8ef_0%,#fffbeb_100%)] px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
                    Catalogos ativos
                  </span>
                  <h2 className="mt-2 font-display text-2xl">
                    Materiais para compartilhar
                  </h2>
                </div>
                <span className="rounded-full bg-[#ecfdf5] px-3 py-1 text-sm font-semibold text-accent">
                  {portal.revistas.length} liberado(s)
                </span>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4">
                {portal.revistas.length ? (
                  portal.revistas.map((revista) => (
                    <article
                      key={revista.id}
                      className="rounded-[24px] border border-[#f1e0c8] bg-white p-5"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <h3 className="text-lg font-semibold">
                            {revista.titulo} {revista.edicao}
                          </h3>
                          <p className="mt-1 text-sm text-muted">
                            Vigencia ate {formatShortDate(revista.vigenciaFim)}
                          </p>
                        </div>

                        <div className="rounded-full bg-[#ecfdf5] px-3 py-1 text-sm font-semibold text-accent">
                          Margem {formatPercent(revista.margemPadrao)}
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-3">
                        {revista.catalogoUrl ? (
                          <a
                            href={revista.catalogoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-full border border-[#d9eadf] bg-white px-4 py-2 text-sm font-semibold transition hover:bg-[#f8fffb]"
                          >
                            Abrir catalogo
                          </a>
                        ) : null}
                        <a
                          href={`/minha-area?revista=${revista.id}#catalogo-clique`}
                          className="rounded-full border border-[#dbeee8] bg-[#f8fffb] px-4 py-2 text-sm font-semibold transition hover:bg-white"
                        >
                          Selecionar itens deste catalogo
                        </a>
                        <a
                          href={buildCatalogWhatsAppShareLink(revista)}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#115e59]"
                        >
                          Compartilhar
                        </a>
                      </div>
                    </article>
                  ))
                ) : (
                  <div className="rounded-[24px] border border-dashed border-[#e4d3b8] p-6 text-sm text-muted">
                    Ainda nao existem catalogos vinculados para a sua area.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            id="minha-comissao"
            className="overflow-hidden rounded-[30px] border border-[#dbeee8] bg-[#f8fffb] shadow-[0_22px_70px_rgba(15,118,110,0.1)]"
          >
            <div className="border-b border-[#dbeee8] bg-[linear-gradient(135deg,#ecfdf5_0%,#f0fdf4_100%)] px-6 py-5 sm:px-8">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
                    Minha comissao
                  </span>
                  <h2 className="mt-2 font-display text-2xl">
                    Leitura rapida do periodo
                  </h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-accent">
                  Somente seus numeros
                </span>
              </div>
            </div>

            <div className="px-6 py-6 sm:px-8">
              <div className="grid gap-4">
                <article className="rounded-[24px] border border-[#dbeee8] bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                    Comissao a receber
                  </p>
                  <p className="mt-3 font-display text-3xl">
                    {formatCurrency(portal.totais.comissaoEmAberto)}
                  </p>
                  <a
                    href="#meus-pedidos"
                    className="mt-4 inline-block text-sm font-semibold text-accent"
                  >
                    Ver pedidos que ainda contam para esse valor
                  </a>
                </article>
                <article className="rounded-[24px] border border-[#dbeee8] bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                    Comissao ja paga
                  </p>
                  <p className="mt-3 font-display text-3xl">
                    {formatCurrency(portal.totais.comissaoPaga)}
                  </p>
                  <a
                    href="#meus-pedidos"
                    className="mt-4 inline-block text-sm font-semibold text-accent"
                  >
                    Revisar pedidos ja fechados
                  </a>
                </article>
                <article className="rounded-[24px] border border-[#dbeee8] bg-white p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                    Pedidos pagos
                  </p>
                  <p className="mt-3 font-display text-3xl">
                    {portal.totais.pedidosPagos}
                  </p>
                  <a
                    href="#meus-pedidos"
                    className="mt-4 inline-block text-sm font-semibold text-accent"
                  >
                    Abrir historico de pedidos pagos
                  </a>
                </article>
              </div>
            </div>
          </section>
        </div>

        <section
          id="meus-pedidos"
          className="overflow-hidden rounded-[30px] border border-[#e4d3b8] bg-[#fffaf4] shadow-[0_22px_70px_rgba(116,76,28,0.1)]"
        >
          <div className="border-b border-[#f1e0c8] bg-[linear-gradient(135deg,#fff8ef_0%,#fffbeb_100%)] px-6 py-5 sm:px-8">
            <div className="flex items-center justify-between gap-3">
              <div>
                <span className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
                  Meus pedidos
                </span>
                <h2 className="mt-2 font-display text-2xl">
                  Historico do que ja foi enviado
                </h2>
              </div>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-accent">
                {portal.pedidos.length} pedido(s)
              </span>
            </div>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-4">
              {portal.pedidos.length ? (
                portal.pedidos.map((pedido) => (
                  <article
                    key={pedido.id}
                    className="rounded-[24px] border border-[#f1e0c8] bg-white p-5"
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

                      <div className="rounded-full bg-[#ecfdf5] px-3 py-1 text-sm font-semibold text-accent">
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

                    <div className="mt-4 flex flex-wrap gap-3">
                      <a
                        href={buildWhatsAppOrderLink(
                          pedido,
                          snapshot.whatsappDestino,
                        )}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full bg-[#0f766e] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#115e59]"
                      >
                        Reenviar no WhatsApp
                      </a>
                      <a
                        href="#montar-pedido"
                        className="rounded-full border border-[#dbeee8] px-4 py-2 text-sm font-semibold transition hover:bg-[#f8fffb]"
                      >
                        Voltar para montar
                      </a>
                    </div>
                  </article>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[#e4d3b8] p-6 text-sm text-muted">
                  Ainda nao existem pedidos seus registrados no sistema.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </SellerShell>
  );
}
