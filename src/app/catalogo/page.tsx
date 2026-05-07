import Link from "next/link";
import { AppShell } from "../_components/app-shell";
import { CatalogoBoard } from "../_components/catalogo-board";
import { requireAdminUser } from "@/lib/auth-admin";
import { getDashboardSnapshot } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CatalogoPage() {
  await requireAdminUser();
  const snapshot = await getDashboardSnapshot();

  return (
    <AppShell
      eyebrow="Admin"
      title="Revistas, produtos e estoque"
      description="Catalogo e estoque."
      badge={
        snapshot.supabaseReady
          ? "Supabase"
          : "Demonstracao"
      }
      actions={
        <>
          <Link
            href="/vendedoras"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
          >
            Vendedoras
          </Link>
          <Link
            href="/pedidos"
            className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:bg-accent-strong"
          >
            Pedidos
          </Link>
        </>
      }
    >
      <CatalogoBoard
        revistas={snapshot.revistas}
        produtos={snapshot.produtos}
      />
    </AppShell>
  );
}
