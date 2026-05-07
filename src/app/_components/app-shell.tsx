"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import {
  adminNavigation,
  type AdminNavigationItem,
} from "@/lib/admin-menu";

type AppShellProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  badge?: string;
  actions?: ReactNode;
  navigationItems?: AdminNavigationItem[];
  children: ReactNode;
};

function isCurrentRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname.startsWith(href);
}

export function AppShell({
  eyebrow,
  title,
  description,
  badge,
  actions,
  navigationItems = adminNavigation,
  children,
}: AppShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
        <header className="surface-card-strong rounded-[30px] px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex-1">
                <p className="eyebrow">Venda Revistas WhatsApp</p>
                {eyebrow ? (
                  <p className="mt-3 text-sm font-semibold text-accent">
                    {eyebrow}
                  </p>
                ) : null}
                <h1 className="mt-2 font-display text-2xl sm:text-3xl">
                  {title}
                </h1>
                {description ? (
                  <p className="mt-2 max-w-3xl text-sm text-muted sm:text-base">
                    {description}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                {badge ? (
                  <div className="rounded-full border border-[color:var(--line)] bg-white/80 px-4 py-2 text-sm font-semibold text-accent">
                    {badge}
                  </div>
                ) : null}
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
                        ? "bg-[#1d1915] text-white"
                        : "border border-[color:var(--line)] bg-white/70 text-foreground hover:bg-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="pb-10 pt-6">{children}</main>
      </div>
    </div>
  );
}
