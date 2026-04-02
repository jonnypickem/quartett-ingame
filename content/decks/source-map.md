# Deck Source Map

This build ships three visible deck packs with local image assets in `public/decks/*`:

- `military-jets-v1`
- `supercars-v1`
- `military-submarines-v1`

Card records (names, IDs, and specs) are generated from the content manifest in:

- `content/decks/content-manifest.json`

Seed SQL is generated from the manifest via:

- `scripts/generate-seed-from-manifest.mjs`
- output: `supabase/seed.sql`

Local image paths are mapped as:

- `/decks/<deck-id>/01.jpg` ... `/decks/<deck-id>/32.jpg`

Deck content manifest:

- `content/decks/content-manifest.json`
- Includes per-card image mapping, source URLs, real-world spec payloads (`unit`, `icon`, `caption`), and estimate flags.

Catalog behavior:

- `kind=deck-catalog` returns only visible decks.
- `kind=deck&id=<deck-id>` resolves an exact deck ID.
