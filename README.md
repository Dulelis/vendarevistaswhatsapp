# Venda Revistas WhatsApp

Base inicial do app de controle comercial para vendas por revista via WhatsApp.

## Stack

- `Next.js` com `App Router`
- `TypeScript`
- `Tailwind CSS`
- `Supabase` ja integrado ao CRUD de `vendedoras`
- `Supabase Auth` preparado para a area da vendedora via magic link

## O que ja existe

- Dashboard inicial com visao da operacao
- CRUD de `vendedoras` com leitura e gravacao no `Supabase`
- Fallback local no navegador quando o banco ainda nao estiver configurado
- Paginas de catalogo e pedidos para validar o fluxo
- Geracao de link e mensagem de pedido para `WhatsApp`
- Schema SQL inicial em [supabase/schema.sql](supabase/schema.sql)

## Rotas

- `/` painel principal
- `/vendedoras` cadastro das vendedoras
- `/catalogo` revistas e produtos
- `/pedidos` fluxo dos pedidos e comissao
- `/financeiro` comissoes e prioridades
- `/relatorios` fechamento e leitura da campanha
- `/login-admin` login do painel da gerente
- `/login-vendedora` login por email da vendedora
- `/minha-area` area autenticada da vendedora

## Rodando localmente

```bash
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Variaveis de ambiente

Copie `.env.example` e preencha quando quiser ligar a infraestrutura real:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_WHATSAPP_DESTINO=5511999999999
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ADMIN_EMAILS=gerente@empresa.com
```

## Supabase

1. Crie um projeto no Supabase.
2. Execute o SQL de [supabase/schema.sql](supabase/schema.sql).
3. Preencha as variaveis de ambiente.
4. Use `SUPABASE_SERVICE_ROLE_KEY` no servidor para o CRUD administrativo.
5. O app passa a ler e gravar `vendedoras` diretamente no banco.
6. Para a area da vendedora, rode tambem os `ALTER TABLE` novos do schema e configure no Supabase o redirect para `http://localhost:3000/auth/confirm`.
7. No template de email do magic link no Supabase, aponte o link para `/auth/confirm` para que a sessao seja trocada corretamente no servidor.

## Login da vendedora

1. Cadastre um `email` na vendedora.
2. A vendedora acessa `/login-vendedora`.
3. O Supabase envia um magic link.
4. Depois da confirmacao, ela entra em `/minha-area` com a propria visao.

## Login do admin

1. Preencha `ADMIN_EMAILS` com um ou mais emails separados por virgula.
2. O admin acessa `/login-admin`.
3. O Supabase envia o magic link.
4. Depois da confirmacao, as rotas administrativas passam a exigir esse acesso.

## Observacao sobre o MVP atual

Se o `Supabase` nao estiver configurado, a tela de `vendedoras` volta para o modo local e salva no navegador.
Quando as variaveis estiverem preenchidas, o CRUD passa a usar o banco automaticamente.

## Proximos passos sugeridos

1. Ativar permissao real entre admin e vendedora.
2. Consolidar a area da vendedora como fluxo definitivo.
3. Exportar o fechamento mensal.
4. Automatizar avisos e pedidos via WhatsApp.
