create table if not exists public.decks (
  id text primary key,
  name text not null,
  is_builtin boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.deck_cards (
  id text primary key,
  deck_id text not null references public.decks(id) on delete cascade,
  code text not null,
  category text not null,
  image_url text not null,
  specs jsonb not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique (deck_id, code)
);

create table if not exists public.game_players (
  id text primary key,
  session_id uuid not null references public.game_sessions(id) on delete cascade,
  player_name text not null,
  color text not null,
  is_host boolean not null default false,
  seat_index smallint not null check (seat_index between 1 and 2),
  joined_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  unique (session_id, seat_index)
);

alter table public.game_sessions
  add column if not exists status text not null default 'lobby',
  add column if not exists host_player_id text,
  add column if not exists deck_id text,
  add column if not exists winner_player_id text;

create index if not exists game_players_session_idx on public.game_players(session_id);
create index if not exists deck_cards_deck_idx on public.deck_cards(deck_id, sort_order);
create index if not exists game_sessions_session_code_idx on public.game_sessions(session_code);

alter table public.decks enable row level security;
alter table public.deck_cards enable row level security;
alter table public.game_players enable row level security;

create policy "Allow read decks" on public.decks
  for select
  using (true);

create policy "Allow read deck cards" on public.deck_cards
  for select
  using (true);
