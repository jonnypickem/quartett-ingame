# Deck Balance Sheet

## Strategy

Specs are manifest-driven and deterministic per card:

- Each card stores explicit normalized gameplay specs in `content/decks/content-manifest.json`
- Values are clamped to `1..100`
- Raw metric proxies and source references are tracked alongside each card in the same manifest
- `supabase/seed.sql` is generated from this manifest to keep frontend fallback and backend runtime aligned

## Jet Specs

- Speed
- Range
- Payload
- Ceiling
- Agility
- Stealth

## Supercar Specs

- Top Speed
- Acceleration
- Power
- Handling
- Braking
- Rarity

## Submarine Specs

- Sub Speed
- Dive Depth
- Endurance
- Quietness
- Firepower
- Sensors

## Validation Targets

- 3 visible decks
- 32 cards per deck
- Consistent spec keys per deck
- Local `.jpg` asset path per card
