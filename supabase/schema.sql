create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.vendedoras (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text,
  auth_user_id uuid references auth.users(id) on delete set null,
  whatsapp text not null,
  telefone text,
  percentual_comissao numeric(5, 2) not null default 20,
  cidade text,
  ativa boolean not null default true,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.vendedoras disable row level security;
alter table public.vendedoras add column if not exists email text;
alter table public.vendedoras add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create table if not exists public.revistas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  edicao text not null,
  vigencia_inicio date not null,
  vigencia_fim date not null,
  margem_padrao numeric(5, 2) not null default 20,
  catalogo_url text,
  catalogo_nome_arquivo text,
  texto_compartilhamento text,
  ativa boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (titulo, edicao)
);
alter table public.revistas disable row level security;
alter table public.revistas add column if not exists catalogo_url text;
alter table public.revistas add column if not exists catalogo_nome_arquivo text;
alter table public.revistas add column if not exists texto_compartilhamento text;

create table if not exists public.produtos (
  id uuid primary key default gen_random_uuid(),
  revista_id uuid not null references public.revistas(id) on delete cascade,
  codigo text not null,
  nome text not null,
  categoria text,
  preco_catalogo numeric(10, 2) not null,
  margem_comissao numeric(5, 2),
  estoque_atual integer not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (revista_id, codigo)
);
alter table public.produtos disable row level security;

create table if not exists public.pedidos (
  id uuid primary key default gen_random_uuid(),
  codigo text not null unique,
  vendedora_id uuid not null references public.vendedoras(id),
  data_pedido timestamptz not null default now(),
  status text not null default 'pendente'
    check (status in ('rascunho', 'pendente', 'separacao', 'pago', 'cancelado')),
  valor_total numeric(12, 2) not null default 0,
  comissao_calculada numeric(12, 2) not null default 0,
  enviado_por_whatsapp boolean not null default true,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.pedidos disable row level security;

create table if not exists public.itens_pedido (
  id uuid primary key default gen_random_uuid(),
  pedido_id uuid not null references public.pedidos(id) on delete cascade,
  produto_id uuid not null references public.produtos(id),
  quantidade integer not null check (quantidade > 0),
  preco_unitario numeric(10, 2) not null,
  percentual_comissao numeric(5, 2) not null,
  subtotal numeric(12, 2) generated always as (quantidade * preco_unitario) stored,
  created_at timestamptz not null default now()
);
alter table public.itens_pedido disable row level security;

create index if not exists idx_produtos_revista on public.produtos (revista_id);
create index if not exists idx_pedidos_vendedora on public.pedidos (vendedora_id);
create index if not exists idx_pedidos_status on public.pedidos (status);
create index if not exists idx_itens_pedido_pedido on public.itens_pedido (pedido_id);
create unique index if not exists idx_vendedoras_email_unique
on public.vendedoras (lower(email))
where email is not null;
create unique index if not exists idx_vendedoras_auth_user_id_unique
on public.vendedoras (auth_user_id)
where auth_user_id is not null;

drop trigger if exists set_vendedoras_updated_at on public.vendedoras;
create trigger set_vendedoras_updated_at
before update on public.vendedoras
for each row
execute function public.set_updated_at();

drop trigger if exists set_revistas_updated_at on public.revistas;
create trigger set_revistas_updated_at
before update on public.revistas
for each row
execute function public.set_updated_at();

drop trigger if exists set_produtos_updated_at on public.produtos;
create trigger set_produtos_updated_at
before update on public.produtos
for each row
execute function public.set_updated_at();

drop trigger if exists set_pedidos_updated_at on public.pedidos;
create trigger set_pedidos_updated_at
before update on public.pedidos
for each row
execute function public.set_updated_at();

create or replace view public.contas_a_pagar_vendedoras as
select
  v.id as vendedora_id,
  v.nome,
  count(p.id) filter (where p.status in ('pendente', 'separacao')) as pedidos_em_aberto,
  coalesce(sum(p.comissao_calculada) filter (where p.status <> 'cancelado'), 0) as comissao_total
from public.vendedoras v
left join public.pedidos p on p.vendedora_id = v.id
group by v.id, v.nome;
