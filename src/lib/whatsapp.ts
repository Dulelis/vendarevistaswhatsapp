import { onlyDigits } from "./formatters";
import type { Pedido } from "./types";

const FALLBACK_DESTINATION = "5511999999999";

function formatCurrencyForMessage(value: number) {
  return `R$ ${value.toFixed(2).replace(".", ",")}`;
}

export function buildPedidoObservacoesText(
  clienteNome: string,
  observacoes: string,
) {
  const linhas = [];

  if (clienteNome.trim()) {
    linhas.push(`Cliente final: ${clienteNome.trim()}`);
  }

  if (observacoes.trim()) {
    linhas.push(`Detalhes: ${observacoes.trim()}`);
  }

  return linhas.join("\n");
}

export function buildWhatsAppOrderText(pedido: Pedido) {
  const itens = pedido.itens.length
    ? pedido.itens
        .map(
          (item) =>
            `- ${item.quantidade}x ${item.produtoNome} | ${item.revistaTitulo} | ${formatCurrencyForMessage(item.precoUnitario)} cada`,
        )
        .join("\n")
    : "- Sem itens selecionados";
  const observacoes = pedido.observacoes?.trim();

  return [
    `Pedido da vendedora ${pedido.vendedoraNome}`,
    `Codigo: ${pedido.codigo}`,
    "",
    "Itens do pedido:",
    itens,
    "",
    `Total estimado: ${formatCurrencyForMessage(pedido.valorTotal)}`,
    `Comissao prevista: ${formatCurrencyForMessage(pedido.comissaoCalculada)}`,
    ...(observacoes ? ["", "Observacoes:", observacoes] : []),
  ].join("\n");
}

export function buildWhatsAppOrderLink(pedido: Pedido, destination: string) {
  const target = onlyDigits(destination) || FALLBACK_DESTINATION;
  const message = encodeURIComponent(buildWhatsAppOrderText(pedido));

  return `https://wa.me/${target}?text=${message}`;
}
