import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { VendedorasBoard } from "../_components/vendedoras-board";
import { requireAdminUser } from "@/lib/auth-admin";
import { getDashboardSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function VendedorasPage() {
  await requireAdminUser();
  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell
      eyebrow="Admin"
      title="Vendedoras"
      description="Cadastro e status."
      badge={
        snapshot.supabaseReady
          ? "Supabase"
          : "Local"
      }
      actions={
        <>
          <Link
            href="/pedidos"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Pedidos
          </Link>
          <Link
            href="/login-vendedora"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
          >
            Area da vendedora
          </Link>
        </>
      }
    >
      <VendedorasBoard
        initialVendedoras={snapshot.vendedoras}
        dataSource={snapshot.supabaseReady ? "supabase" : "local"}
      />
    </AppShell>
  );
}
