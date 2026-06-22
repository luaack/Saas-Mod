-- Habilitar a extensão UUID se não estiver ativada
create extension if not exists "uuid-ossp";

-- Criar tabela de usuários (público)
create table public.users (
  id uuid primary key references auth.users on delete cascade,
  email text unique not null,
  name text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS (Row Level Security) para users
alter table public.users enable row level security;

-- Criar tabela de assinaturas e créditos
create table public.subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users on delete cascade not null unique,
  plan text not null default 'free' check (plan in ('free', 'starter', 'pro', 'premium')),
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null check (status in ('active', 'canceled', 'past_due', 'unpaid', 'incomplete')),
  current_period_end timestamp with time zone not null,
  credits_remaining int not null default 50 check (credits_remaining >= 0),
  credits_total int not null default 50 check (credits_total >= 0),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para subscriptions
alter table public.subscriptions enable row level security;

-- Criar tabela de gerações
create table public.generations (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users on delete cascade not null,
  type text not null check (type in ('image', 'video', 'audio', 'text')),
  prompt text not null,
  model text not null,
  output_url text not null,
  credits_used int not null check (credits_used >= 0),
  metadata jsonb default '{}'::jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Habilitar RLS para generations
alter table public.generations enable row level security;

-- =========================================================================
-- Políticas de Segurança (Row Level Security - RLS)
-- =========================================================================

-- users policies
create policy "Usuários podem ler o próprio perfil" on public.users
  for select using (auth.uid() = id);

create policy "Usuários podem atualizar o próprio perfil" on public.users
  for update using (auth.uid() = id);

-- subscriptions policies
create policy "Usuários podem ler a própria assinatura" on public.subscriptions
  for select using (auth.uid() = user_id);

-- generations policies
create policy "Usuários podem ler as próprias gerações" on public.generations
  for select using (auth.uid() = user_id);

create policy "Usuários podem inserir as próprias gerações" on public.generations
  for insert with check (auth.uid() = user_id);

-- =========================================================================
-- Triggers e Funções Auxiliares
-- =========================================================================

-- Trigger para criar perfil de usuário e assinatura inicial grátis ao registrar na autenticação
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Inserir dados do usuário no perfil público
  insert into public.users (id, email, name, avatar_url, created_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    coalesce(new.created_at, now())
  );

  -- Inserir a assinatura free padrão com 50 créditos
  insert into public.subscriptions (
    user_id,
    plan,
    status,
    current_period_end,
    credits_remaining,
    credits_total,
    updated_at
  ) values (
    new.id,
    'free',
    'active',
    now() + interval '1 month',
    50,
    50,
    now()
  );

  return new;
end;
$$ language plpgsql security definer;

-- Associar trigger com a tabela de autenticação do Supabase
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- Função Atômica para Débito de Créditos (Segurança contra Race Conditions)
-- =========================================================================

create or replace function public.deduct_credits(p_user_id uuid, p_amount int)
returns boolean as $$
declare
  v_credits int;
begin
  -- Bloqueia a linha da assinatura para atualização exclusiva nesta transação
  select credits_remaining into v_credits
  from public.subscriptions
  where user_id = p_user_id and status = 'active'
  for update;

  -- Se não encontrar ou não estiver ativa, falha
  if v_credits is null then
    raise exception 'Assinatura ativa não encontrada para o usuário informado.';
  end if;

  -- Verifica se tem saldo suficiente
  if v_credits < p_amount then
    return false;
  end if;

  -- Debita os créditos
  update public.subscriptions
  set credits_remaining = credits_remaining - p_amount,
      updated_at = now()
  where user_id = p_user_id;

  return true;
end;
$$ language plpgsql security definer;
