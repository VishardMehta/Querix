-- Querix production database bootstrap for Supabase.
-- Run this file in Supabase SQL Editor before wiring the API to persistence.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  display_name text not null default 'System Admin',
  email text unique,
  agent_name text not null default 'AGENT_01',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.datasets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles(id) on delete set null,
  client_session_id text,
  file_name text not null,
  table_name text not null,
  source_type text not null default 'csv',
  row_count integer not null default 0,
  column_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  client_session_id text unique,
  owner_id uuid references public.profiles(id) on delete set null,
  dataset_id uuid references public.datasets(id) on delete set null,
  title text not null default 'Untitled session',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.datasets add column if not exists client_session_id text;
alter table public.chat_sessions add column if not exists client_session_id text;

create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  query_result jsonb,
  thinking_steps jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.query_runs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.chat_sessions(id) on delete cascade,
  dataset_id uuid references public.datasets(id) on delete set null,
  question text not null,
  sql text,
  answer text,
  chart_payload jsonb,
  confidence integer,
  timings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists datasets_owner_created_idx on public.datasets(owner_id, created_at desc);
create index if not exists datasets_client_session_idx on public.datasets(client_session_id, created_at desc);
create index if not exists chat_sessions_owner_created_idx on public.chat_sessions(owner_id, created_at desc);
create unique index if not exists chat_sessions_client_session_uidx on public.chat_sessions(client_session_id);
create index if not exists chat_messages_session_created_idx on public.chat_messages(session_id, created_at);
create index if not exists query_runs_session_created_idx on public.query_runs(session_id, created_at desc);

create or replace function public.touch_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists chat_sessions_touch_updated_at on public.chat_sessions;
create trigger chat_sessions_touch_updated_at
before update on public.chat_sessions
for each row execute function public.touch_updated_at();

alter table public.profiles enable row level security;
alter table public.datasets enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;
alter table public.query_runs enable row level security;

-- The backend should use SUPABASE_SERVICE_ROLE_KEY for server-side persistence.
-- Public client policies can be added once authentication is introduced.
