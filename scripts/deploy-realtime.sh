#!/usr/bin/env bash
set -euo pipefail

: "${SUPABASE_DB_URL:?Missing SUPABASE_DB_URL}"
: "${SUPABASE_PROJECT_REF:?Missing SUPABASE_PROJECT_REF}"
: "${VITE_GAME_ACTION_ENDPOINT:?Missing VITE_GAME_ACTION_ENDPOINT}"

if ! command -v supabase >/dev/null 2>&1; then
  echo "supabase CLI is required." >&2
  exit 1
fi

echo "[1/4] Applying migrations..."
supabase db push --db-url "$SUPABASE_DB_URL" --include-all

echo "[2/4] Seeding deterministic runtime session..."
supabase db push --db-url "$SUPABASE_DB_URL" --include-seed

echo "[3/4] Deploying edge function..."
supabase functions deploy game-action --project-ref "$SUPABASE_PROJECT_REF" --no-verify-jwt --use-api

echo "[4/4] Verifying GET/POST API contract..."
node scripts/check-api-contract.mjs

echo "Realtime go-live workflow completed."
