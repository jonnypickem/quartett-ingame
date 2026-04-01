# Deck Balance Sheet

## Strategy

Specs are generated with a tiered, deterministic formula so decks stay playable while preserving real-world flavor:

- Tier baseline (2-5) per card
- Deterministic stat jitter from `hashtext` (backend seed) / seeded hash (frontend mock)
- Clamped to `1..100`

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
- Local asset path per card
