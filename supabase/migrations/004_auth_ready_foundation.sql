create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.game_players
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists game_players_user_id_idx on public.game_players(user_id);
create unique index if not exists game_players_session_user_uidx
  on public.game_players(session_id, user_id)
  where user_id is not null;

create table if not exists public.deck_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  cover_image_url text not null default '',
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.idea_submissions (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  details text not null default '',
  status text not null default 'open' check (status in ('open', 'in_review', 'planned', 'shipped', 'closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists deck_submissions_owner_idx on public.deck_submissions(owner_user_id, created_at desc);
create index if not exists idea_submissions_owner_idx on public.idea_submissions(owner_user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.deck_submissions enable row level security;
alter table public.idea_submissions enable row level security;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.deck_submissions to authenticated;
grant select, insert, update, delete on public.idea_submissions to authenticated;

drop policy if exists "Profiles are owner-readable" on public.profiles;
create policy "Profiles are owner-readable"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

drop policy if exists "Profiles are owner-writable" on public.profiles;
create policy "Profiles are owner-writable"
  on public.profiles
  for all
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "Deck submissions are owner-readable" on public.deck_submissions;
create policy "Deck submissions are owner-readable"
  on public.deck_submissions
  for select
  to authenticated
  using (auth.uid() = owner_user_id);

drop policy if exists "Deck submissions are owner-writable" on public.deck_submissions;
create policy "Deck submissions are owner-writable"
  on public.deck_submissions
  for all
  to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);

drop policy if exists "Idea submissions are owner-readable" on public.idea_submissions;
create policy "Idea submissions are owner-readable"
  on public.idea_submissions
  for select
  to authenticated
  using (auth.uid() = owner_user_id);

drop policy if exists "Idea submissions are owner-writable" on public.idea_submissions;
create policy "Idea submissions are owner-writable"
  on public.idea_submissions
  for all
  to authenticated
  using (auth.uid() = owner_user_id)
  with check (auth.uid() = owner_user_id);
