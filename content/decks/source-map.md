# Deck Source Map

This build ships three visible deck packs with local image assets in `public/decks/*`:

- `military-jets-v1`
- `supercars-v1`
- `military-submarines-v1`

Card records (names, IDs, and specs) are generated from the deck seed in:

- `src/data/decks.ts`

Local image paths are mapped as:

- `/decks/<deck-id>/01.svg` ... `/decks/<deck-id>/32.svg`

Hidden-deck behavior:

- Hidden decks are excluded from catalog responses (`kind=deck-catalog`)
- Hidden decks are still resolvable with exact ID (`kind=deck&id=<exact-id>`)

Current hidden deck in seed data:

- `pirate-ships-v1`
