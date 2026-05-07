import Link from "next/link";
import { AppShell } from "./_components/app-shell";
import { requireAdminUser } from "@/lib/auth-admin";
import { getDashboardSnapshot } from "@/lib/data";
import { formatCurrency } from "@/lib/formatters";
import { adminModules } from "@/lib/admin-menu";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  await requireAdminUser();
  const snapshot = await getDashboardSnapshot();
  const activeVendedoras = snapshot.vendedoras.filter((item) => item.ativa).length;
  const totalProdutos = snapshot.produtos.filter((item) => item.ativo !== false).length;
  const pedidosPagos = snapshot.pedidos.filter((item) => item.status === "pago").length;

  const metrics = [
    {
      label: "Vendedoras",
      value: `${snapshot.resumo.totalVendedoras}`,
      tone: "bg-[#fff7ed]",
    },
    {
      label: "Produtos",
      value: `${totalProdutos}`,
      tone: "bg-[#eef8f4]",
    },
    {
      label: "Pedidos pendentes",
      value: `${snapshot.resumo.pedidosPendentes}`,
      tone: "bg-[#f5efe7]",
    },
    {
      label: "Faturamento",
      value: formatCurrency(snapshot.resumo.faturamentoMes),
      tone: "bg-[#eef1fb]",
    },
  ];

  const modules = adminModules.map((module) => {
    switch (module.href) {
      case "/vendedoras":
        return {
          ...module,
          primary: `${snapshot.resumo.totalVendedoras} cadastradas`,
          secondary: `${activeVendedoras} ativas`,
        };
      case "/catalogo":
        return {
          ...module,
          primary: `${snapshot.resumo.revistasAtivas} revistas ativas`,
          secondary: `${totalProdutos} produtos`,
        };
      case "/pedidos":
        return {
          ...module,
          primary: `${snapshot.pedidos.length} pedidos`,
          secondary: `${snapshot.resumo.pedidosPendentes} pendentes`,
        };
      case "/financeiro":
        return {
          ...module,
          primary: formatCurrency(snapshot.resumo.comissoesPrevistas),
          secondary: `${pedidosPagos} pagos`,
        };
      case "/relatorios":
        return {
          ...module,
          primary: formatCurrency(snapshot.resumo.faturamentoMes),
          secondary: `Ticket ${formatCurrency(snapshot.resumo.ticketMedio)}`,
        };
      case "/vendedora":
        return {
          ...module,
          primary: "Visao da vendedora",
          secondary: "Preview",
        };
      default:
        return {
          ...module,
          primary: "",
          secondary: "",
        };
    }
  });

  return (
    <AppShell
      eyebrow="Admin"
      title="Painel administrativo"
      description="Menus principais do sistema."
      badge={
        snapshot.supabaseReady
          ? "Supabase configurado"
          : "Modo demonstracao"
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
            href="/vendedoras"
            className="rounded-full border border-[color:var(--line)] px-4 py-2 text-sm font-semibold transition hover:bg-white/70"
          >
            Vendedoras
          </Link>
        </>
      }
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className={`surface-card rounded-[24px] p-5 ${metric.tone}`}
          >
            <p className="text-sm text-muted">{metric.label}</p>
            <p className="mt-3 font-display text-3xl">{metric.value}</p>
          </article>
        ))}
      </div>

      <section className="surface-card mt-6 rounded-[28px] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="eyebrow">Menus</span>
            <h2 className="mt-2 font-display text-2xl">Modulos</h2>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {modules.map((module) => (
            <Link
              key={module.href}
              href={module.href}
              className={`rounded-[24px] border border-[color:var(--line)] ${module.tone} p-5 transition hover:-translate-y-0.5 hover:border-accent hover:bg-white/85`}
            >
              <p className={`text-xs uppercase tracking-[0.18em] ${module.accent}`}>
                {module.label}
              </p>
              <h3 className="mt-2 text-xl font-semibold">{module.title}</h3>
              <p className="mt-5 font-semibold">{module.primary}</p>
              <p className="mt-1 text-sm text-muted">{module.secondary}</p>
            </Link>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
