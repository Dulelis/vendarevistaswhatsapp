import { createSupabaseAuthServerClient } from "./supabase/auth-server";
import {
  findVendedoraByAuthUserId,
  findVendedoraByEmail,
  linkVendedoraAuthUserByEmail,
} from "./vendedoras";

export function getAppBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

export async function getAuthenticatedVendedora() {
  const supabase = await createSupabaseAuthServerClient();

  if (!supabase) {
    return {
      user: null,
      vendedora: null,
    };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      user: null,
      vendedora: null,
    };
  }

  let vendedora = await findVendedoraByAuthUserId(user.id);

  if (!vendedora && user.email) {
    await linkVendedoraAuthUserByEmail(user.email, user.id);
    vendedora = await findVendedoraByAuthUserId(user.id);
  }

  if (!vendedora && user.email) {
    vendedora = await findVendedoraByEmail(user.email);
  }

  return {
    user,
    vendedora,
  };
}

export async function assertVendedoraActionAccess() {
  const result = await getAuthenticatedVendedora();

  if (!result.user || !result.vendedora || !result.vendedora.ativa) {
    throw new Error("Sua sessao de vendedora expirou. Entre novamente.");
  }

  return result;
}
