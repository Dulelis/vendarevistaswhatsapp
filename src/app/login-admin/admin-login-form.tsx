"use client";

import { useState, useTransition } from "react";
import { sendAdminMagicLinkAction } from "./actions";

export function LoginAdminForm() {
  const [message, setMessage] = useState(
    "Informe um email de admin liberado no ambiente para receber o link.",
  );
  const [isSuccess, setIsSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <section className="surface-card rounded-[28px] p-6 sm:p-8">
      <span className="eyebrow">Entrar no admin</span>
      <h2 className="mt-2 font-display text-2xl">
        Receber link de acesso da gerente
      </h2>

      <form
        className="mt-6 grid gap-4"
        action={(formData) =>
          startTransition(async () => {
            const result = await sendAdminMagicLinkAction(formData);
            setMessage(result.message);
            setIsSuccess(result.ok);
          })
        }
      >
        <label className="text-sm font-medium">
          Email do admin
          <input
            name="email"
            type="email"
            required
            placeholder="gerente@empresa.com"
            className="mt-2 w-full rounded-[18px] border border-[color:var(--line)] bg-white/75 px-4 py-3 text-sm outline-none transition focus:border-accent focus:bg-white"
          />
        </label>

        <button
          type="submit"
          disabled={isPending}
          className="rounded-full bg-[#1d1915] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "Enviando acesso..." : "Enviar magic link"}
        </button>
      </form>

      <div
        className={`mt-6 rounded-[22px] border p-4 text-sm leading-6 ${
          isSuccess
            ? "border-[color:var(--line)] bg-[#eef8f4] text-accent"
            : "border-[color:var(--line)] bg-white/60 text-muted"
        }`}
      >
        {message}
      </div>
    </section>
  );
}
