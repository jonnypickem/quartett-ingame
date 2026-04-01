alter table public.decks
  add column if not exists description text not null default '',
  add column if not exists cover_image_url text not null default '',
  add column if not exists is_hidden boolean not null default false;

create index if not exists decks_visibility_idx on public.decks(is_hidden, id);

