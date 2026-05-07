"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

type SellerNavigationItem = {
  href: string;
  label: string;
};

type SellerShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  badge: string;
  actions?: ReactNode;
  navigationItems?: SellerNavigationItem[];
  children: ReactNode;
};

const defaultNavigation: SellerNavigationItem[] = [
  { href: "/login-vendedora", label: "Entrar" },
  { href: "/minha-area", label: "Minha area" },
];

function isCurrentRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function SellerShell({
  eyebrow,
  title,
  description,
  badge,
  actions,
  navigationItems = defaultNavigation,
  children,
}: SellerShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7_0%,transparent_26%),radial-gradient(circle_at_bottom_right,#d1fae5_0%,transparent_24%),linear-gradient(180deg,#fff8ef_0%,#f9f4ea_44%,#f4eee2_100%)]">
      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="overflow-hidden rounded-[36px] border border-[#f0d7b6] bg-[#fffaf2] shadow-[0_28px_80px_rgba(116,76,28,0.12)]">
          <div className="bg-[linear-gradient(135deg,#115e59_0%,#0f766e_42%,#f59e0b_100%)] px-5 py-6 text-white sm:px-8 sm:py-8">
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <p className="text-xs uppercase tracking-[0.22em] text-white/80">
                    {eyebrow}
                  </p>
                  <h1 className="mt-3 font-display text-3xl leading-tight sm:text-4xl">
                    {title}
                  </h1>
                  <p className="mt-3 text-sm leading-6 text-white/85 sm:text-base">
                    {description}
                  </p>
                </div>

                <div className="flex flex-col items-start gap-3 lg:items-end">
                  <div className="rounded-full border border-white/25 bg-white/15 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
                    {badge}
                  </div>
                  {actions}
                </div>
              </div>

              <nav className="flex flex-wrap gap-2">
                {navigationItems.map((item) => {
                  const active = isCurrentRoute(pathname, item.href);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        active
                          ? "bg-[#fff7ed] text-[#115e59]"
                          : "border border-white/20 bg-white/12 text-white hover:bg-white/20"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="soft-grid px-4 py-4 sm:px-6">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-[22px] border border-[rgba(17,94,89,0.12)] bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                  Compartilhar
                </p>
                <p className="mt-2 text-sm text-muted">
                  Catalogos e mensagens prontas para usar no WhatsApp.
                </p>
              </div>
              <div className="rounded-[22px] border border-[rgba(17,94,89,0.12)] bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                  Acompanhar
                </p>
                <p className="mt-2 text-sm text-muted">
                  Seus pedidos, status e comissao em uma leitura simples.
                </p>
              </div>
              <div className="rounded-[22px] border border-[rgba(17,94,89,0.12)] bg-white/85 p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                  Responder rapido
                </p>
                <p className="mt-2 text-sm text-muted">
                  Visual desenhado para celular, sem misturar com o painel da gerente.
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="pb-10 pt-6">{children}</main>
      </div>
    </div>
  );
}
