"use client";

import type { EmailOtpType } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { createSupabaseAuthBrowserClient } from "@/lib/supabase/auth-browser";

type AuthConfirmClientProps = {
  code?: string;
  nextPath: string;
  tokenHash?: string;
  type?: string;
};

function getLoginPath(nextPath: string) {
  return nextPath.startsWith("/minha-area") ? "/login-vendedora" : "/login-admin";
}

export function AuthConfirmClient({
  code,
  nextPath,
  tokenHash,
  type,
}: AuthConfirmClientProps) {
  const [message, setMessage] = useState("Validando seu acesso...");

  useEffect(() => {
    let isCancelled = false;

    async function finishAuth() {
      const loginPath = getLoginPath(nextPath);
      const supabase = createSupabaseAuthBrowserClient();

      if (!supabase) {
        window.location.replace(`${loginPath}?erro=link-invalido`);
        return;
      }

      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");
      const otpType = (type as EmailOtpType | undefined) ?? null;

      setMessage("Criando sua sessao segura...");

      let authError: Error | null = null;

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });

        authError = error;
      } else if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        authError = error;
      } else if (tokenHash && otpType) {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: otpType,
        });

        authError = error;
      } else {
        authError = new Error("Link de autenticacao sem credenciais validas.");
      }

      if (authError) {
        window.location.replace(`${loginPath}?erro=link-invalido`);
        return;
      }

      if (!isCancelled) {
        setMessage("Tudo certo. Abrindo sua area...");
      }

      window.location.replace(nextPath);
    }

    void finishAuth();

    return () => {
      isCancelled = true;
    };
  }, [code, nextPath, tokenHash, type]);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="surface-card w-full max-w-xl rounded-[28px] p-6 text-center sm:p-8">
        <p className="eyebrow">Confirmando acesso</p>
        <h1 className="mt-2 font-display text-3xl">Entrando no sistema</h1>
        <p className="mt-4 text-sm leading-6 text-muted sm:text-base">
          {message}
        </p>
      </div>
    </div>
  );
}
