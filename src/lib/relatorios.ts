import { buildFinanceiroResumo } from "./financeiro";
import type { Pedido, Produto, Revista, Vendedora } from "./types";

export type RankingItem = {
  label: string;
  pedidos: number;
  unidades: number;
  faturamento: number;
  comissao: number;
  ativa?: boolean;
};

export type LinhaTimeline = {
  data: string;
  pedidos: number;
  faturamento: number;
  comissao: number;
};

export type RelatorioMensal = {
  totais: {
    faturamento: number;
    comissaoEmAberto: number;
    comissaoPaga: number;
    ticketMedio: number;
    pedidosEmAberto: number;
    pedidosPagos: number;
    unidadesVendidas: number;
    estoqueCritico: number;
  };
  rankingRevistas: RankingItem[];
  rankingCategorias: RankingItem[];
  rankingVendedoras: ReturnType<typeof buildFinanceiroResumo>["ranking"];
  timeline: LinhaTimeline[];
  checklist: string[];
};

function buildRevistaLabel(revista: Revista) {
  return `${revista.titulo} ${revista.edicao}`.trim();
}

function sortRanking(items: Map<string, RankingItem>) {
  return [...items.values()].sort((a, b) => {
    if (b.faturamento !== a.faturamento) {
      return b.faturamento - a.faturamento;
    }

    if (b.unidades !== a.unidades) {
      return b.unidades - a.unidades;
    }

    return a.label.localeCompare(b.label, "pt-BR");
  });
}

export function buildRelatorioMensal(
  pedidos: Pedido[],
  vendedoras: Vendedora[],
  produtos: Produto[],
  revistas: Revista[],
): RelatorioMensal {
  const financeiro = buildFinanceiroResumo(pedidos, vendedoras);
  const produtoMap = new Map(produtos.map((item) => [item.id, item]));
  const revistaMap = new Map(
    revistas.map((item) => [buildRevistaLabel(item), item]),
  );
  const rankingRevistas = new Map<string, RankingItem>();
  const rankingCategorias = new Map<string, RankingItem>();
  const timeline = new Map<string, LinhaTimeline>();
  let unidadesVendidas = 0;

  for (const pedido of pedidos) {
    const timelineKey = pedido.criadoEm.slice(0, 10);
    const timelineItem = timeline.get(timelineKey) ?? {
      data: timelineKey,
      pedidos: 0,
      faturamento: 0,
      comissao: 0,
    };

    timelineItem.pedidos += 1;
    timelineItem.faturamento += pedido.valorTotal;
    timelineItem.comissao += pedido.comissaoCalculada;
    timeline.set(timelineKey, timelineItem);

    for (const item of pedido.itens) {
      unidadesVendidas += item.quantidade;
      const revistaLabel = item.revistaTitulo;
      const categoria =
        produtoMap.get(item.produtoId)?.categoria ?? "Sem categoria";
      const itemTotal = item.quantidade * item.precoUnitario;
      const itemComissao = (itemTotal * item.percentualComissao) / 100;
      const revista = revistaMap.get(revistaLabel);

      const revistaItem = rankingRevistas.get(revistaLabel) ?? {
        label: revistaLabel,
        pedidos: 0,
        unidades: 0,
        faturamento: 0,
        comissao: 0,
        ativa: revista?.ativa ?? false,
      };

      revistaItem.pedidos += 1;
      revistaItem.unidades += item.quantidade;
      revistaItem.faturamento += itemTotal;
      revistaItem.comissao += itemComissao;
      rankingRevistas.set(revistaLabel, revistaItem);

      const categoriaItem = rankingCategorias.get(categoria) ?? {
        label: categoria,
        pedidos: 0,
        unidades: 0,
        faturamento: 0,
        comissao: 0,
      };

      categoriaItem.pedidos += 1;
      categoriaItem.unidades += item.quantidade;
      categoriaItem.faturamento += itemTotal;
      categoriaItem.comissao += itemComissao;
      rankingCategorias.set(categoria, categoriaItem);
    }
  }

  const estoqueCritico = produtos.filter((item) => item.estoqueAtual <= 5).length;
  const checklist = [
    financeiro.totais.pedidosEmAberto
      ? `${financeiro.totais.pedidosEmAberto} pedido(s) seguem em aberto e precisam entrar no fechamento.`
      : "Nao ha pedidos em aberto no momento, o fechamento esta limpo.",
    estoqueCritico
      ? `${estoqueCritico} produto(s) estao com estoque critico e merecem revisao antes da proxima campanha.`
      : "Nenhum produto entrou em faixa de estoque critico.",
    financeiro.ranking.length
      ? `A maior comissao em aberto agora e de ${financeiro.ranking[0]?.nome}.`
      : "Ainda nao ha vendedoras suficientes para montar um ranking de fechamento.",
    revistas.filter((item) => item.ativa).length
      ? `${revistas.filter((item) => item.ativa).length} campanha(s) seguem ativas para compartilhamento.`
      : "Nenhuma campanha ativa foi marcada no catalogo.",
  ];

  return {
    totais: {
      faturamento: financeiro.totais.faturamentoTotal,
      comissaoEmAberto: financeiro.totais.comissaoEmAberto,
      comissaoPaga: financeiro.totais.comissaoPaga,
      ticketMedio: pedidos.length
        ? financeiro.totais.faturamentoTotal / pedidos.length
        : 0,
      pedidosEmAberto: financeiro.totais.pedidosEmAberto,
      pedidosPagos: financeiro.totais.pedidosPagos,
      unidadesVendidas,
      estoqueCritico,
    },
    rankingRevistas: sortRanking(rankingRevistas),
    rankingCategorias: sortRanking(rankingCategorias),
    rankingVendedoras: financeiro.ranking,
    timeline: [...timeline.values()].sort((a, b) => b.data.localeCompare(a.data)),
    checklist,
  };
}
