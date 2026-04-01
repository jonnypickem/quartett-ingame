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
- URL-based dual perspective:
  - `/?session=<session-id>&player=<player-id>`
  - Invalid-context handling for missing session/player and player-not-in-session.
- Supabase backend scaffolding:
  - SQL schema migration
  - Edge Function endpoint `game-action` with:
    - `GET` bootstrap (`state + latestEventId`)
    - `POST` action handling (`state + appliedVersion + latestEventId`)

## URL usage

Open the app with query params:

```text
/?session=<session-id>&player=<player-id>
```

Examples:

- `/?session=demo-session-01&player=p1`
- `/?session=demo-session-01&player=p2`

The UI includes helper links to open both player perspectives in separate tabs for QA.

## Deterministic Seed Session

- Session UUID: `11111111-1111-1111-1111-111111111111`
- Session code: `QRT001`
- Player IDs: `p1`, `p2`

Test URLs:

- `/?session=11111111-1111-1111-1111-111111111111&player=p1`
- `/?session=11111111-1111-1111-1111-111111111111&player=p2`

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

Set required envs (local shell or CI):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_GAME_ACTION_ENDPOINT`
- `SUPABASE_DB_URL`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN` (needed by Supabase CLI for remote deploy)

Then run:

```bash
npm run go-live:deploy
```

This workflow performs:

1. Migration push (`supabase/migrations/001_game_schema.sql`)
2. Deterministic seed (`supabase/seed.sql`)
3. Function deploy (`supabase/functions/game-action`)
4. GET/POST contract verification (`npm run test:contract`)

If you want to run steps manually:

```bash
supabase db push --db-url "$SUPABASE_DB_URL" --include-all
supabase db push --db-url "$SUPABASE_DB_URL" --include-seed
supabase functions deploy game-action --project-ref "$SUPABASE_PROJECT_REF" --no-verify-jwt --use-api
npm run test:contract
```

Edge function contract (frozen for this phase):

- `GET /game-action?session=<uuid>` -> `SessionBootstrapResponse { state, latestEventId }`
- `POST /game-action` -> `ActionResponse { state, events, appliedVersion, latestEventId }`

When any realtime env dependency is missing (`VITE_GAME_ACTION_ENDPOINT`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`), the app explicitly falls back to local mock runtime mode.

## Production Realtime Checklist

1. Set all required env variables and confirm `VITE_GAME_ACTION_ENDPOINT` points to the deployed function URL.
2. Run `npm run go-live:deploy`.
3. Open both seeded test URLs in separate tabs.
4. Validate:
   - spec highlight mirrors across tabs,
   - send/accept/decline updates card counts and top cards on both tabs,
   - tie and lost-tie (accept/decline) follow rules,
   - refresh both tabs and confirm state bootstraps consistently.

Common failure modes:

- Wrong anon key or project URL:
  - symptom: frontend stays in error/local mode, bootstrap fails.
- Missing/incorrect endpoint URL:
  - symptom: contract test and game actions fail with 404/400.
- Missing read policy on `game_events`/`game_sessions`:
  - symptom: bootstrap may work but realtime subscription never updates.
- Session not seeded:
  - symptom: GET bootstrap returns `Session not found`.

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
