# Quartett 2-Player Realtime (Vite + Supabase + Vercel)

Anonymous 2-player Quartett web game with full create/join/lobby/game/finish flow.

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
- Full product flow:
  - Landing (create or join)
  - Realtime lobby (invite code, join link, QR)
  - Host start-game gate (2 players required)
  - Running duel gameplay
  - Finished screen with winner
- Session restoration:
  - Session-scoped player identity persisted in browser storage.
  - Refresh/reopen restores player seat without account login.
- Supabase backend scaffolding:
  - SQL schema + product-flow migration
  - Edge Function endpoint `game-action` with:
    - `GET` bootstrap by session id
    - `POST` create session / join session
    - `POST` host start-game + duel actions

## Primary UX

Open root URL and use the in-app flow:

- Create game with player name
- Share invite code / QR
- Second player joins by code
- Host starts game

Session links still work directly:

- `/?session=<session-id>&player=<player-id>`

## Deterministic Seed Session

- Session UUID: `11111111-1111-1111-1111-111111111111`
- Session code: `QRT001`
- Player IDs: `p1`, `p2`

Test URLs:

- `/?session=11111111-1111-1111-1111-111111111111&player=p1`
- `/?session=11111111-1111-1111-1111-111111111111&player=p2`

## Project structure

- `src/` frontend app, game engine, reducer, hook, components, tests
- `supabase/migrations/001_game_schema.sql` base schema
- `supabase/migrations/002_product_flow_schema.sql` players + deck model + lifecycle columns
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

1. Migration push (`supabase/migrations/*`)
2. Deterministic seed (`supabase/seed.sql`)
3. Function deploy (`supabase/functions/game-action`)
4. GET/POST contract verification (`npm run test:contract`)
5. Deterministic seed restore (`supabase/seed.sql`)

If you want to run steps manually:

```bash
supabase db push --db-url "$SUPABASE_DB_URL" --include-all
supabase db push --db-url "$SUPABASE_DB_URL" --include-seed
supabase functions deploy game-action --project-ref "$SUPABASE_PROJECT_REF" --no-verify-jwt --use-api
npm run test:contract
supabase db push --db-url "$SUPABASE_DB_URL" --include-seed
```

Edge function contract:

- `GET /game-action?session=<uuid>` -> `SessionBootstrapResponse { state, latestEventId }`
- `POST /game-action` -> `ActionResponse { state, events, appliedVersion, latestEventId }`
- `POST /game-action` with `kind: "CREATE_SESSION"` -> `SessionAccessResponse { state, latestEventId, playerId }`
- `POST /game-action` with `kind: "JOIN_SESSION"` -> `SessionAccessResponse { state, latestEventId, playerId }`

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
