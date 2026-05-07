import { buildFinanceiroResumo } from "./financeiro";
import type { Pedido, Produto, Revista, Vendedora } from "./types";

export type PortalVendedoraData = {
  selecionada: Vendedora | null;
  opcoes: Vendedora[];
  pedidos: Pedido[];
  revistas: Revista[];
  totais: {
    totalVendido: number;
    comissaoEmAberto: number;
    comissaoPaga: number;
    pedidosEmAberto: number;
    pedidosPagos: number;
    ticketMedio: number;
  };
};

function buildRevistaLabel(revista: Revista) {
  return `${revista.titulo} ${revista.edicao}`.trim();
}

export function filterProdutosDisponiveisParaVendedora(
  produtos: Produto[],
  revistas: Revista[],
) {
  const revistasDisponiveisIds = new Set(revistas.map((revista) => revista.id));
  const revistasDisponiveisLabels = new Set(revistas.map(buildRevistaLabel));

  return produtos
    .filter(
      (produto) =>
        produto.ativo !== false &&
        (revistasDisponiveisIds.has(produto.revistaId) ||
          revistasDisponiveisLabels.has(produto.revistaTitulo)),
    )
    .sort((left, right) => {
      const byRevista = left.revistaTitulo.localeCompare(right.revistaTitulo);

      return byRevista !== 0 ? byRevista : left.nome.localeCompare(right.nome);
    });
}

export function buildPortalVendedoraData(
  vendedoras: Vendedora[],
  revistas: Revista[],
  pedidos: Pedido[],
  selectedId?: string,
): PortalVendedoraData {
  const opcoes = vendedoras.filter((item) => item.ativa);
  const selecionada =
    opcoes.find((item) => item.id === selectedId) ??
    opcoes[0] ??
    vendedoras[0] ??
    null;

  if (!selecionada) {
    return {
      selecionada: null,
      opcoes: [],
      pedidos: [],
      revistas: [],
      totais: {
        totalVendido: 0,
        comissaoEmAberto: 0,
        comissaoPaga: 0,
        pedidosEmAberto: 0,
        pedidosPagos: 0,
        ticketMedio: 0,
      },
    };
  }

  const pedidosDaVendedora = pedidos
    .filter((item) => item.vendedoraId === selecionada.id)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm));
  const financeiro = buildFinanceiroResumo(pedidosDaVendedora, [selecionada]);
  const totais = financeiro.ranking[0] ?? {
    valorEmAberto: 0,
    valorPago: 0,
    comissaoEmAberto: 0,
    comissaoPaga: 0,
    pedidosEmAberto: 0,
    pedidosPagos: 0,
    ticketMedio: 0,
  };
  const revistasDisponiveis = revistas.filter((item) => {
    const label = buildRevistaLabel(item);

    return (
      item.ativa ||
      selecionada.revistasAtivas.includes(label) ||
      pedidosDaVendedora.some((pedido) =>
        pedido.itens.some((pedidoItem) => pedidoItem.revistaTitulo === label),
      )
    );
  });

  return {
    selecionada,
    opcoes,
    pedidos: pedidosDaVendedora,
    revistas: revistasDisponiveis,
    totais: {
      totalVendido: totais.valorEmAberto + totais.valorPago,
      comissaoEmAberto: totais.comissaoEmAberto,
      comissaoPaga: totais.comissaoPaga,
      pedidosEmAberto: totais.pedidosEmAberto,
      pedidosPagos: totais.pedidosPagos,
      ticketMedio: totais.ticketMedio,
    },
  };
}
