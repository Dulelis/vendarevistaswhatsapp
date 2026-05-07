import { AuthConfirmClient } from "./auth-confirm-client";

export const dynamic = "force-dynamic";

type AuthConfirmPageProps = {
  searchParams?: Promise<{
    code?: string;
    next?: string;
    token_hash?: string;
    type?: string;
  }>;
};

export default async function AuthConfirmPage({
  searchParams,
}: AuthConfirmPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  return (
    <AuthConfirmClient
      code={resolvedSearchParams?.code}
      nextPath={resolvedSearchParams?.next ?? "/minha-area"}
      tokenHash={resolvedSearchParams?.token_hash}
      type={resolvedSearchParams?.type}
    />
  );
}
