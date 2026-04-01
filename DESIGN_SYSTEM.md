# Quartett UI Design System

This design system is implemented in `/Users/jonny/Documents/Quartett/src/styles/design-system.css` and consumed by `/Users/jonny/Documents/Quartett/src/styles/app.css`.

## Design goals

- Keep gameplay readable first, with one dominant interaction area.
- Keep mobile ergonomics strong (large tap targets, clear spacing, sticky action intent).
- Use one visual language across landing, lobby, duel, and finish.

## Core tokens

- Primary blue: `#01ADFF`
- Highlight yellow: `#FFF738`
- Accent purple: `#C669FF`
- Accent orange: `#FF8038`
- Ink: `#313337`
- Paper background: `#F4F1EB` to `#E1DCD5`

Typography:

- Display: `Sigmar`
- Body/UI text: `Nunito`

Spacing:

- 4 / 8 / 12 / 16 / 20 / 24 / 32 px scale (`--space-1` ... `--space-7`)

Radii:

- `12`, `18`, `24`, `30`, and `pill`

## Component patterns

- Top bar: bright brand block + status chip.
- Primary cards: white/paper gradient with dark outline + rounded corners.
- Primary CTA: yellow, highest contrast, always visible.
- Secondary CTA: purple for supporting actions.
- Gameplay HUD: single status strip + one active card surface + one action panel.

## Screen templates

- Landing/Join: two clear tasks (create or join), no competing content.
- Lobby: split into invite/share card and roster card.
- Gameplay: top context, card interaction area, action controls.
- Finish: winner callout + concise rankings + return CTA.

## Motion and accessibility

- Motion is reserved for key interactions (send card flight, button hover, selected stat state).
- Reduced-motion is supported via `prefers-reduced-motion` in token CSS.
- Spec buttons expose pressed state with `aria-pressed`.
