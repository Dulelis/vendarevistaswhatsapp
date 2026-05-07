"use client";

import { useState, useTransition } from "react";
import { sendVendedoraMagicLinkAction } from "./actions";

export function LoginVendedoraForm() {
  const [message, setMessage] = useState(
    "Informe o email liberado pela gerente para receber o link de acesso.",
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="overflow-hidden rounded-[30px] border border-[#d9eadf] bg-[#f8fffb] shadow-[0_22px_70px_rgba(15,118,110,0.12)]">
      <div className="bg-[linear-gradient(135deg,#0f766e_0%,#115e59_100%)] px-6 py-6 text-white sm:px-8">
        <span className="text-xs uppercase tracking-[0.22em] text-white/80">
          Enviar acesso
        </span>
        <h2 className="mt-2 font-display text-2xl">
          Receber meu link por email
        </h2>
        <p className="mt-3 text-sm leading-6 text-white/85">
          Assim que o email estiver liberado pela gerente, o link chega para
          voce e abre sua area direto.
        </p>
      </div>

      <div className="px-6 py-6 sm:px-8">
        <form
          className="grid gap-4"
          action={(formData) =>
            startTransition(async () => {
              const result = await sendVendedoraMagicLinkAction(formData);
              setMessage(result.message);
              setIsSuccess(result.ok);
            })
          }
        >
          <label className="text-sm font-medium">
            Email de acesso
            <input
              name="email"
              type="email"
              required
              placeholder="ana@revistas.app"
              className="mt-2 w-full rounded-[18px] border border-[#cce6df] bg-white px-4 py-3 text-sm outline-none transition focus:border-[#0f766e] focus:bg-white"
            />
          </label>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-full bg-[#0f766e] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#115e59] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isPending ? "Enviando acesso..." : "Enviar magic link"}
          </button>
        </form>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[22px] border border-[#dbeee8] bg-white p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#0f766e]">
              Dica
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Use o mesmo email que a gerente cadastrou na sua ficha.
            </p>
          </div>
          <div className="rounded-[22px] border border-[#f1e0c8] bg-[#fff8ee] p-4">
            <p className="text-xs uppercase tracking-[0.18em] text-[#b45309]">
              Importante
            </p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Se o link nao chegar, confira a caixa de spam ou peca um novo envio.
            </p>
          </div>
        </div>

        <div
          className={`mt-6 rounded-[22px] border p-4 text-sm leading-6 ${
            isSuccess
              ? "border-[#b7e2d8] bg-[#ecfdf5] text-accent"
              : "border-[#e5e7eb] bg-white/80 text-muted"
          }`}
        >
          {message}
        </div>
      </div>
    </section>
  );
}
