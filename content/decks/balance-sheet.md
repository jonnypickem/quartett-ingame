# Deck Balance Sheet

## Strategy

Specs are generated deterministically from each card's `(name, tier)` seed:

- Tier baseline (2-5) per card
- Reproducible seeded offsets per metric
- Clamped to `1..100`
- Monotonic mapping from normalized values to raw-world proxy units in `content/decks/content-manifest.json`

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
