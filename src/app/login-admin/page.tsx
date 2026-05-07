import Link from "next/link";
import { redirect } from "next/navigation";
import { AppShell } from "../_components/app-shell";
import {
  getAuthenticatedAdmin,
  getAdminEmails,
  isLocalAdminBypassEnabled,
  isAdminProtectionEnabled,
} from "@/lib/auth-admin";
import { adminModules } from "@/lib/admin-menu";
import { LoginAdminForm } from "./admin-login-form";

type LoginAdminPageProps = {
  searchParams?: Promise<{
    erro?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "sem-acesso":
    "Esse usuario nao esta liberado como admin. Verifique a variavel ADMIN_EMAILS.",
  "link-invalido":
    "Esse link de acesso nao era valido ou ja expirou. Peca um novo envio.",
};

export default async function LoginAdminPage({
  searchParams,
}: LoginAdminPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const adminSession = await getAuthenticatedAdmin();
  const localBypassEnabled = isLocalAdminBypassEnabled();
  if (adminSession.user && adminSession.isAdmin) {
    redirect("/");
  }
  const errorMessage = resolvedSearchParams?.erro
    ? errorMessages[resolvedSearchParams.erro] ??
      "Nao consegui validar o acesso do admin."
    : null;
  const adminEmails = getAdminEmails();
  const protectionEnabled = isAdminProtectionEnabled();
  const canOpenAdminPanel = adminSession.isAdmin;
  const quickCards = [
    {
      title: "Pedir magic link",
      href: "#receber-link",
      accent: "text-accent",
      bg: "bg-white/60",
    },
    {
      title: "Ver emails liberados",
      href: "#emails-liberados",
      accent: "text-[#b45309]",
      bg: "bg-[#fff7ed]",
    },
    {
      title: "Desbloquear o app admin",
      href: "#preview-admin",
      accent: "text-accent",
      bg: "bg-[#ecfdf5]",
    },
    ...(localBypassEnabled
      ? [
          {
            title: "Entrar em modo local",
            href: "/",
            accent: "text-[#7c2d12]",
            bg: "bg-[#fff4ea]",
          },
        ]
      : []),
    {
      title: "Testar area da vendedora",
      href: "/login-vendedora",
      accent: "text-[#115e59]",
      bg: "bg-white/60",
    },
  ];

  return (
    <AppShell
      eyebrow="Acesso"
      title="Entrar no painel da gerente"
      description="Magic link do admin."
      badge={
        localBypassEnabled
          ? "Modo local ativo"
          : protectionEnabled
            ? "Protecao ativa"
            : "Aguardando ADMIN_EMAILS"
      }
      navigationItems={[
        { href: "/login-admin", label: "Entrar admin" },
        { href: "/login-vendedora", label: "Entrar vendedora" },
      ]}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/login-vendedora"
            className="rounded-full border border-[color:var(--line)] px-5 py-3 text-sm font-semibold transition hover:bg-white/70"
          >
            Area da vendedora
          </Link>
          {canOpenAdminPanel ? (
            <Link
              href="/"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              Abrir admin local
            </Link>
          ) : (
            <a
              href="#receber-link"
              className="rounded-full bg-accent px-5 py-3 text-sm font-semibold text-white transition hover:bg-accent-strong"
            >
              Receber magic link
            </a>
          )}
        </div>
      }
    >
      <div className="mx-auto grid max-w-6xl gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <section className="surface-card rounded-[28px] p-6 sm:p-8">
          <span className="eyebrow">Atalhos</span>
          <h2 className="mt-2 font-display text-2xl">Acesso do admin</h2>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {quickCards.map((item) => (
              <a
                key={item.title}
                href={item.href}
                className={`rounded-[22px] border border-[color:var(--line)] ${item.bg} p-4 transition hover:-translate-y-0.5 hover:border-accent hover:bg-white/85`}
              >
                <p className={`text-sm font-semibold ${item.accent}`}>
                  {item.title}
                </p>
              </a>
            ))}
          </div>

          <div
            id="emails-liberados"
            className="mt-6 rounded-[22px] border border-[color:var(--line)] bg-[#f7f1e7] p-4 text-sm leading-6 text-muted"
          >
            <p className="font-semibold text-foreground">Emails liberados</p>
            <p className="mt-2">
              {adminEmails.length
                ? adminEmails.join(", ")
                : "Nenhum email de admin configurado ainda."}
            </p>
            <p className="mt-3 text-sm">
              {protectionEnabled
                ? "Se o seu email nao estiver aqui, o painel bloqueia o acesso mesmo com o link."
                : "Enquanto ADMIN_EMAILS nao estiver preenchido, o acesso protegido do admin ainda nao esta fechado."}
            </p>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-[22px] border border-[#e7c9b8] bg-[#fff3ea] p-4 text-sm leading-6 text-warm">
              {errorMessage}
            </div>
          ) : null}

          {localBypassEnabled ? (
            <div className="mt-6 rounded-[22px] border border-[#d7c4ab] bg-[#fff8ef] p-4 text-sm leading-6 text-muted">
              <p className="font-semibold text-foreground">
                Acesso local liberado
              </p>
              <p className="mt-2">
                Esse ambiente esta com `DEV_ADMIN_BYPASS=true`. Enquanto voce
                estiver em desenvolvimento local, pode abrir o admin direto pela
                raiz do sistema sem esperar o magic link.
              </p>
              <div className="mt-4">
                <Link
                  href="/"
                  className="inline-flex rounded-full bg-[#1d1915] px-4 py-2 text-sm font-semibold text-white transition hover:bg-black"
                >
                  Entrar no admin agora
                </Link>
              </div>
            </div>
          ) : null}

          <div className="mt-6 rounded-[22px] border border-dashed border-[color:var(--line)] bg-white/65 p-4 text-sm leading-6 text-muted">
            <p className="font-semibold text-foreground">
              Esta tela e so a porta de entrada
            </p>
            <p className="mt-2">
              O painel com cara de app aparece depois da autenticacao. Assim que
              o email autorizado entrar pelo magic link, a raiz do sistema abre
              com os modulos de cadastro, catalogo, pedidos, comissoes e
              relatorios.
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div id="receber-link">
            <LoginAdminForm />
          </div>

          <section
            id="preview-admin"
            className="surface-card rounded-[28px] p-6 sm:p-8"
          >
            <div className="flex flex-col gap-2">
              <span className="eyebrow">Preview</span>
              <h2 className="font-display text-2xl">Modulos</h2>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {adminModules.map((module) => (
                <Link
                  key={module.title}
                  href={canOpenAdminPanel ? "/" : "#receber-link"}
                  className={`rounded-[22px] border border-[color:var(--line)] ${module.tone} p-4 transition hover:-translate-y-0.5 hover:border-accent hover:bg-white/85`}
                >
                  <p className={`text-sm font-semibold ${module.accent}`}>
                    {module.title}
                  </p>
                  <p className="mt-4 text-sm font-semibold text-accent">
                    {canOpenAdminPanel
                      ? "Abrir modulo pelo painel"
                      : "Disponivel depois do login"}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        </section>
      </div>
    </AppShell>
  );
}
