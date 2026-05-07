import { onlyDigits } from "./formatters";
import type { Pedido, StatusPedido, Vendedora } from "./types";

const FALLBACK_DESTINATION = "5511999999999";

export type VendedoraFinanceiro = {
  id: string;
  nome: string;
  whatsapp: string;
  percentualComissao: number;
  pedidosEmAberto: number;
  pedidosPagos: number;
  valorEmAberto: number;
  valorPago: number;
  comissaoEmAberto: number;
  comissaoPaga: number;
  ticketMedio: number;
  ultimoPedidoEm?: string;
};

export type FinanceiroResumo = {
  ranking: VendedoraFinanceiro[];
  totais: {
    comissaoEmAberto: number;
    comissaoPaga: number;
    faturamentoTotal: number;
    pedidosEmAberto: number;
    pedidosPagos: number;
  };
};

function isPedidoEmAberto(status: StatusPedido) {
  return status !== "pago" && status !== "cancelado";
}

function createFinanceiroItem(
  vendedoraId: string,
  vendedorasMap: Map<string, Vendedora>,
  fallbackNome?: string,
): VendedoraFinanceiro {
  const vendedora = vendedorasMap.get(vendedoraId);

  return {
    id: vendedoraId,
    nome: vendedora?.nome ?? fallbackNome ?? "Vendedora sem cadastro",
    whatsapp: vendedora?.whatsapp ?? "",
    percentualComissao: vendedora?.percentualComissao ?? 0,
    pedidosEmAberto: 0,
    pedidosPagos: 0,
    valorEmAberto: 0,
    valorPago: 0,
    comissaoEmAberto: 0,
    comissaoPaga: 0,
    ticketMedio: 0,
    ultimoPedidoEm: undefined,
  };
}

export function buildFinanceiroResumo(
  pedidos: Pedido[],
  vendedoras: Vendedora[],
): FinanceiroResumo {
  const vendedorasMap = new Map(vendedoras.map((item) => [item.id, item]));
  const rankingMap = new Map<string, VendedoraFinanceiro>();

  for (const vendedora of vendedoras) {
    rankingMap.set(
      vendedora.id,
      createFinanceiroItem(vendedora.id, vendedorasMap),
    );
  }

  for (const pedido of pedidos) {
    const item =
      rankingMap.get(pedido.vendedoraId) ??
      createFinanceiroItem(
        pedido.vendedoraId,
        vendedorasMap,
        pedido.vendedoraNome,
      );

    if (pedido.status === "pago") {
      item.pedidosPagos += 1;
      item.valorPago += pedido.valorTotal;
      item.comissaoPaga += pedido.comissaoCalculada;
    } else if (isPedidoEmAberto(pedido.status)) {
      item.pedidosEmAberto += 1;
      item.valorEmAberto += pedido.valorTotal;
      item.comissaoEmAberto += pedido.comissaoCalculada;
    }

    const totalPedidos = item.pedidosEmAberto + item.pedidosPagos;
    const totalVendido = item.valorEmAberto + item.valorPago;
    item.ticketMedio = totalPedidos ? totalVendido / totalPedidos : 0;

    if (!item.ultimoPedidoEm || new Date(pedido.criadoEm) > new Date(item.ultimoPedidoEm)) {
      item.ultimoPedidoEm = pedido.criadoEm;
    }

    rankingMap.set(pedido.vendedoraId, item);
  }

  const ranking = [...rankingMap.values()].sort((a, b) => {
    if (b.comissaoEmAberto !== a.comissaoEmAberto) {
      return b.comissaoEmAberto - a.comissaoEmAberto;
    }

    if (b.valorEmAberto !== a.valorEmAberto) {
      return b.valorEmAberto - a.valorEmAberto;
    }

    return a.nome.localeCompare(b.nome, "pt-BR");
  });

  return {
    ranking,
    totais: ranking.reduce(
      (acc, item) => {
        acc.comissaoEmAberto += item.comissaoEmAberto;
        acc.comissaoPaga += item.comissaoPaga;
        acc.faturamentoTotal += item.valorEmAberto + item.valorPago;
        acc.pedidosEmAberto += item.pedidosEmAberto;
        acc.pedidosPagos += item.pedidosPagos;
        return acc;
      },
      {
        comissaoEmAberto: 0,
        comissaoPaga: 0,
        faturamentoTotal: 0,
        pedidosEmAberto: 0,
        pedidosPagos: 0,
      },
    ),
  };
}

export function buildComissaoShareText(item: VendedoraFinanceiro) {
  const linhas = [
    `Resumo financeiro da vendedora ${item.nome}`,
    "",
    `Pedidos em aberto: ${item.pedidosEmAberto}`,
    `Comissao em aberto: R$ ${item.comissaoEmAberto.toFixed(2).replace(".", ",")}`,
    `Pedidos pagos: ${item.pedidosPagos}`,
    `Comissao paga: R$ ${item.comissaoPaga.toFixed(2).replace(".", ",")}`,
    `Ticket medio: R$ ${item.ticketMedio.toFixed(2).replace(".", ",")}`,
  ];

  if (item.ultimoPedidoEm) {
    linhas.push(
      `Ultimo pedido: ${new Intl.DateTimeFormat("pt-BR").format(new Date(item.ultimoPedidoEm))}`,
    );
  }

  return linhas.join("\n");
}

export function buildComissaoShareLink(item: VendedoraFinanceiro) {
  const target = onlyDigits(item.whatsapp) || FALLBACK_DESTINATION;
  const message = encodeURIComponent(buildComissaoShareText(item));

  return `https://wa.me/${target}?text=${message}`;
}
