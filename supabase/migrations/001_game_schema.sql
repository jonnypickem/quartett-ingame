create extension if not exists pgcrypto;

create table if not exists public.game_sessions (
  id uuid primary key default gen_random_uuid(),
  session_code text unique not null,
  state jsonb not null,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.game_events (
  id bigserial primary key,
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists game_events_session_id_idx on public.game_events(session_id, id desc);

alter table public.game_sessions enable row level security;
alter table public.game_events enable row level security;

create policy "Allow read game sessions" on public.game_sessions
  for select
  using (true);

create policy "Allow read game events" on public.game_events
  for select
  using (true);
