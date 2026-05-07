import Link from "next/link";
import { SellerShell } from "../_components/seller-shell";
import { LoginVendedoraForm } from "./vendedora-login-form";

type LoginVendedoraPageProps = {
  searchParams?: Promise<{
    erro?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  "sem-acesso":
    "Esse email ainda nao esta vinculado a uma vendedora ativa. Confira o cadastro com a gerente.",
  "link-invalido":
    "Esse link de acesso nao era valido ou ja expirou. Peca um novo envio.",
};

export default async function LoginVendedoraPage({
  searchParams,
}: LoginVendedoraPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const errorMessage = resolvedSearchParams?.erro
    ? errorMessages[resolvedSearchParams.erro] ??
      "Nao consegui validar o acesso da vendedora."
    : null;

  return (
    <SellerShell
      eyebrow="Acesso da vendedora"
      title="Entrar com link por email"
      description="A gerente libera o email da vendedora no cadastro. Depois disso, a propria vendedora entra com um link seguro recebido no email e cai direto na area dela."
      badge="Acesso por magic link do Supabase"
      navigationItems={[
        { href: "/login-vendedora", label: "Entrar" },
        { href: "/minha-area", label: "Minha area" },
      ]}
      actions={
        <div className="flex flex-wrap gap-3">
          <Link
            href="/vendedoras"
            className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            Ajustar cadastro
          </Link>
          <Link
            href="/minha-area"
            className="rounded-full bg-[#fff7ed] px-5 py-3 text-sm font-semibold text-[#115e59] transition hover:bg-white"
          >
            Abrir minha area
          </Link>
        </div>
      }
    >
      <div className="mx-auto grid max-w-5xl gap-6 xl:grid-cols-[0.92fr_1.08fr]">
        <section className="overflow-hidden rounded-[30px] border border-[#ead7bb] bg-[#fffaf4] shadow-[0_22px_70px_rgba(116,76,28,0.1)]">
          <div className="border-b border-[#f1e0c8] bg-[linear-gradient(135deg,#fff7ed_0%,#fffbeb_100%)] px-6 py-6 sm:px-8">
            <span className="text-xs uppercase tracking-[0.22em] text-[#0f766e]">
              Como funciona
            </span>
            <h2 className="mt-2 font-display text-2xl">
              Um acesso simples para o dia a dia
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-muted">
              A ideia aqui e deixar a vendedora longe do painel administrativo e
              perto do que importa: compartilhar, acompanhar e voltar rapido
              para a conversa com a cliente.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            <div className="grid gap-3">
              {[
                "A gerente cadastra o email da vendedora na base.",
                "A vendedora pede o link de acesso nesta tela.",
                "O Supabase envia um email com o magic link.",
                "Ao abrir o link, o sistema identifica a vendedora e mostra apenas a area dela.",
              ].map((item, index) => (
                <div
                  key={item}
                  className="flex items-start gap-4 rounded-[22px] border border-[#f1e0c8] bg-white/80 p-4"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#0f766e] text-sm font-semibold text-white">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-sm leading-6 text-muted">{item}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-[#f1e0c8] bg-[#ecfdf5] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
                  Feito para celular
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  A leitura e direta e os botoes principais ficam sempre claros.
                </p>
              </div>
              <div className="rounded-[22px] border border-[#f1e0c8] bg-[#fff7ed] p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-[#b45309]">
                  Sem senha fixa
                </p>
                <p className="mt-2 text-sm leading-6 text-muted">
                  O acesso acontece por link, sem precisar decorar senha.
                </p>
              </div>
            </div>

            {errorMessage ? (
              <div className="mt-6 rounded-[22px] border border-[#e7c9b8] bg-[#fff3ea] p-4 text-sm leading-6 text-warm">
                {errorMessage}
              </div>
            ) : null}
          </div>
        </section>

        <LoginVendedoraForm />
      </div>
    </SellerShell>
  );
}
