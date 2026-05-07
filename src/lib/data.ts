import { mockDashboardSnapshot } from "./mock-data";
import type { DashboardSnapshot } from "./types";
import { isCatalogoServerConfigured, listProdutos, listRevistas } from "./catalogo";
import { isPedidosServerConfigured, listPedidos } from "./pedidos";
import { isSupabaseServerConfigured, listVendedoras } from "./vendedoras";

function hasSupabasePublicConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getWhatsAppDestination() {
  return (
    process.env.NEXT_PUBLIC_WHATSAPP_DESTINO ??
    mockDashboardSnapshot.whatsappDestino
  );
}

export async function getDashboardSnapshot(): Promise<DashboardSnapshot> {
  const supabaseReady = isSupabaseServerConfigured();
  let vendedoras = mockDashboardSnapshot.vendedoras;
  let revistas = mockDashboardSnapshot.revistas;
  let produtos = mockDashboardSnapshot.produtos;
  let pedidos = mockDashboardSnapshot.pedidos;

  if (supabaseReady) {
    try {
      vendedoras = await listVendedoras();
    } catch {
      vendedoras = mockDashboardSnapshot.vendedoras;
    }
  }

  if (isCatalogoServerConfigured()) {
    try {
      [revistas, produtos] = await Promise.all([listRevistas(), listProdutos()]);
    } catch {
      revistas = mockDashboardSnapshot.revistas;
      produtos = mockDashboardSnapshot.produtos;
    }
  }

  if (isPedidosServerConfigured()) {
    try {
      pedidos = await listPedidos();
    } catch {
      pedidos = mockDashboardSnapshot.pedidos;
    }
  }

  const faturamentoMes = pedidos.reduce((sum, pedido) => sum + pedido.valorTotal, 0);
  const comissoesPrevistas = pedidos.reduce(
    (sum, pedido) => sum + pedido.comissaoCalculada,
    0,
  );
  const pedidosPendentes = pedidos.filter(
    (pedido) => pedido.status === "pendente" || pedido.status === "separacao",
  ).length;

  return {
    ...mockDashboardSnapshot,
    resumo: {
      ...mockDashboardSnapshot.resumo,
      totalVendedoras: vendedoras.length,
      revistasAtivas: revistas.filter((item) => item.ativa).length,
      pedidosPendentes,
      comissoesPrevistas,
      faturamentoMes,
      ticketMedio: pedidos.length ? faturamentoMes / pedidos.length : 0,
    },
    vendedoras,
    revistas,
    produtos,
    pedidos,
    whatsappDestino: getWhatsAppDestination(),
    supabaseReady: supabaseReady || hasSupabasePublicConfig(),
  };
}
