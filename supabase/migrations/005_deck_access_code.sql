alter table public.decks
  add column if not exists access_code text;

create unique index if not exists decks_access_code_uidx
  on public.decks(access_code)
  where access_code is not null;
