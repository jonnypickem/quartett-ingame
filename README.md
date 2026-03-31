# Quartett In-Game Screen v2

Mobile-first React + Vite + TypeScript implementation of the Quartett 1v1 game screen with Method design language.

## What is implemented

- Mobile-first in-game UI matching the provided style language.
- Method tokens and typography:
  - `#01ADFF`, `#FFF738`, `#C669FF`, `#FF8038`, `#FFFFFF`, `#313337`
  - `Sigmar` for headings/buttons/chips.
- Live card counts for user and opponent.
- Full top-card rendering:
  - Card ID (`A1`, `B2`, ...)
  - Category
  - Card image
  - Dynamic spec list (6 to 8 specs)
- Spec selection + mirrored highlight on both cards in selector color.
- Manual social actions:
  - `Send Card` with receiver `Accept/Decline`
  - `Tie` flow
  - `Lost Tie` flow with receiver `Accept/Decline`
- Tie rules implemented:
  - Tie moves both top cards to pot.
  - Repeated tie rounds keep stacking pot.
  - Lost Tie accepted gives winner pot + loser current top card.
  - Lost Tie declined keeps tie active and pot frozen.
- Reducer + event queue to process server events deterministically.
- Supabase backend scaffolding:
  - SQL schema migration
  - Edge Function endpoint `game-action` (server-authoritative action handling)

## Project structure

- `src/` frontend app, game engine, reducer, hook, components, tests
- `supabase/migrations/001_game_schema.sql` database schema
- `supabase/functions/game-action/index.ts` action endpoint

## Local setup

1. Install dependencies

```bash
npm install
```

2. Create `.env` from `.env.example`

```bash
cp .env.example .env
```

3. Run dev server

```bash
npm run dev
```

4. Run tests

```bash
npm test
```

## Supabase setup

1. Apply migration in your Supabase project.
2. Deploy edge function `game-action`.
3. Set frontend env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GAME_ACTION_ENDPOINT`

When `VITE_GAME_ACTION_ENDPOINT` is missing, the app runs with local in-memory action simulation for fast UI testing.

## Create GitHub repo

Run from project root:

```bash
git init
git add .
git commit -m "feat: mobile-first quartett ingame screen v2"
```

If GitHub CLI is authenticated:

```bash
gh repo create quartett-ingame --public --source=. --remote=origin --push
```

Or create a repository manually on GitHub and then run:

```bash
git branch -M main
git remote add origin https://github.com/<your-user>/quartett-ingame.git
git push -u origin main
```
