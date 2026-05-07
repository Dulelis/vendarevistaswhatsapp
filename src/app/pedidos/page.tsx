import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { PedidosBoard } from "../_components/pedidos-board";
import { requireAdminUser } from "@/lib/auth-admin";
import { getDashboardSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  await requireAdminUser();
  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell
      eyebrow="Admin"
      title="Pedidos, WhatsApp e comissao"
      description="Pedidos e envio."
      badge={
        snapshot.supabaseReady
          ? "Supabase"
          : "Demonstracao"
      }
      actions={
        <>
          <Link
            href="/catalogo"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
          >
            Catalogo
          </Link>
          <Link
            href="/vendedoras"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Vendedoras
          </Link>
        </>
      }
    >
      <PedidosBoard
        pedidos={snapshot.pedidos}
        produtos={snapshot.produtos}
        vendedoras={snapshot.vendedoras}
        whatsappDestino={snapshot.whatsappDestino}
      />
    </AppShell>
  );
}
