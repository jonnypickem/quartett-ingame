# Deck Balance Sheet

## Strategy

Specs are manifest-driven and real-world per card:

- Each card stores explicit real metric specs in `content/decks/content-manifest.json`
- Each spec includes icon, unit, caption, and display metadata for UI
- Estimated/partially classified values are flagged with `estimated: true`
- Source attribution is tracked via `sourceUrl` + `metricSources`
- `supabase/seed.sql` is generated from this manifest to keep frontend fallback and backend runtime aligned

## Jet Specs

- Max Speed (km/h)
- Combat Range (km)
- Payload (kg)
- Service Ceiling (m)
- Climb Rate (m/s)
- Radar Cross-Section (m²)

## Supercar Specs

- Top Speed (km/h)
- 0-100 (s)
- Power (hp)
- Torque (Nm)
- Weight (kg)
- Braking 100-0 (m)

## Submarine Specs

- Ammunition / Torpedos
- Max Depth (m)
- Submerged Speed (kn)
- Endurance (days)
- Crew
- Displacement (t)

## Validation Targets

- 3 visible decks
- 32 cards per deck
- Consistent spec keys per deck
- Local `.jpg` asset path per card
