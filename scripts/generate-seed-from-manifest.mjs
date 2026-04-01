import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const manifestPath = path.join(projectRoot, "content/decks/content-manifest.json");
const seedPath = path.join(projectRoot, "supabase/seed.sql");

const DECK_ORDER = ["military-jets-v1", "supercars-v1", "military-submarines-v1"];
const DECK_ORDER_INDEX = new Map(DECK_ORDER.map((deckId, index) => [deckId, index]));

const DECK_DESCRIPTIONS = {
  "military-jets-v1": "Air-superiority icons and strike aircraft from modern military aviation.",
  "supercars-v1": "Hypercar legends and track-focused road missiles.",
  "military-submarines-v1": "Nuclear and diesel-electric attack boats from major naval fleets."
};

const DECK_ID_PREFIX = {
  "military-jets-v1": "miljet",
  "supercars-v1": "supercar",
  "military-submarines-v1": "sub"
};

const DECK_SPEC_KEYS = {
  "military-jets-v1": ["speed", "range", "payload", "ceiling", "agility", "stealth"],
  "supercars-v1": ["top_speed", "acceleration", "power", "handling", "braking", "rarity"],
  "military-submarines-v1": ["submerged_speed", "dive_depth", "endurance", "quietness", "firepower", "sensors"]
};

const SPEC_LABELS = {
  speed: "Speed",
  range: "Range",
  payload: "Payload",
  ceiling: "Ceiling",
  agility: "Agility",
  stealth: "Stealth",
  top_speed: "Top Speed",
  acceleration: "Acceleration",
  power: "Power",
  handling: "Handling",
  braking: "Braking",
  rarity: "Rarity",
  submerged_speed: "Sub Speed",
  dive_depth: "Dive Depth",
  endurance: "Endurance",
  quietness: "Quietness",
  firepower: "Firepower",
  sensors: "Sensors"
};

const sqlString = (value) => `'${String(value).replace(/'/g, "''")}'`;
const sqlJsonb = (value) => `${sqlString(JSON.stringify(value))}::jsonb`;

const toSortRank = (deckId) => DECK_ORDER_INDEX.get(deckId) ?? Number.POSITIVE_INFINITY;

const loadManifest = async () => {
  const raw = await fs.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.decks) || parsed.decks.length === 0) {
    throw new Error("Manifest is missing decks.");
  }
  return parsed;
};

const toDeckCardsValues = (decks) => {
  const tuples = [];
  for (const deck of decks) {
    const prefix = DECK_ID_PREFIX[deck.id] ?? deck.id;
    const specKeys = DECK_SPEC_KEYS[deck.id];
    if (!specKeys) {
      throw new Error(`Missing stat key mapping for deck ${deck.id}`);
    }

    for (const card of deck.cards) {
      const specs = specKeys.map((key) => ({
        key,
        label: SPEC_LABELS[key] ?? key,
        value: Math.max(1, Math.min(100, Math.round(card.specsNormalized[key] ?? 0)))
      }));
      const code = String(card.code).padStart(2, "0");
      const sortOrder = Number.parseInt(code, 10);
      tuples.push(
        `  (${sqlString(`${prefix}-${code}`)}, ${sqlString(deck.id)}, ${sqlString(code)}, ${sqlString(card.name)}, ${sqlString(card.localImageUrl)}, ${sqlJsonb(specs)}, ${sortOrder})`
      );
    }
  }
  return tuples;
};

const renderSeed = (manifest) => {
  const decks = [...manifest.decks]
    .map((deck) => ({
      ...deck,
      cards: [...deck.cards].sort((left, right) => Number(left.code) - Number(right.code))
    }))
    .sort((left, right) => {
      const rankDelta = toSortRank(left.id) - toSortRank(right.id);
      if (rankDelta !== 0) {
        return rankDelta;
      }
      return left.id.localeCompare(right.id);
    });

  for (const deck of decks) {
    if (deck.cards.length !== 32) {
      throw new Error(`Deck ${deck.id} must have exactly 32 cards (found ${deck.cards.length}).`);
    }
    if (!DECK_DESCRIPTIONS[deck.id]) {
      throw new Error(`Missing description for deck ${deck.id}`);
    }
  }

  const deckRows = decks.map((deck) => {
    const coverImage = deck.cards[0]?.localImageUrl ?? `/decks/${deck.id}/01.jpg`;
    return `  (${sqlString(deck.id)}, ${sqlString(deck.name)}, ${sqlString(DECK_DESCRIPTIONS[deck.id])}, ${sqlString(coverImage)}, false, true)`;
  });

  const deckCardsRows = toDeckCardsValues(decks);
  const managedDeckIds = decks.map((deck) => sqlString(deck.id)).join(", ");
  const runtimeDeckId = decks[0].id;
  const runtimeSessionId = "11111111-1111-1111-1111-111111111111";
  const runtimeSessionCode = "QRT001";

  return `-- Deterministic seed for Quartett runtime and local QA
-- Session UUID: ${runtimeSessionId}
-- Session code: ${runtimeSessionCode}
-- Generated from content/decks/content-manifest.json

begin;

insert into public.decks (id, name, description, cover_image_url, is_hidden, is_builtin)
values
${deckRows.join(",\n")}
on conflict (id) do update
set name = excluded.name,
    description = excluded.description,
    cover_image_url = excluded.cover_image_url,
    is_hidden = excluded.is_hidden,
    is_builtin = excluded.is_builtin;

delete from public.deck_cards
where deck_id in (${managedDeckIds}, 'pirate-ships-v1');

insert into public.deck_cards (id, deck_id, code, category, image_url, specs, sort_order)
values
${deckCardsRows.join(",\n")};

delete from public.game_events
where session_id = '${runtimeSessionId}';

delete from public.game_players
where session_id = '${runtimeSessionId}';

delete from public.game_sessions
where id = '${runtimeSessionId}'
   or session_code = '${runtimeSessionCode}';

insert into public.game_sessions (
  id,
  session_code,
  status,
  host_player_id,
  deck_id,
  winner_player_id,
  state,
  version,
  created_at,
  updated_at
)
values (
  '${runtimeSessionId}',
  '${runtimeSessionCode}',
  'running',
  'p1',
  '${runtimeDeckId}',
  null,
  '{}'::jsonb,
  1,
  now(),
  now()
);

insert into public.game_players (id, session_id, player_name, color, is_host, seat_index)
values
  ('p1', '${runtimeSessionId}', 'You', '#01ADFF', true, 1),
  ('p2', '${runtimeSessionId}', 'Opponent', '#C669FF', false, 2);

update public.game_sessions
set state = jsonb_build_object(
  'sessionId', '${runtimeSessionId}',
  'sessionCode', '${runtimeSessionCode}',
  'status', 'running',
  'hostPlayerId', 'p1',
  'deckId', '${runtimeDeckId}',
  'winnerPlayerId', null,
  'players', jsonb_build_array(
    jsonb_build_object(
      'id', 'p1',
      'name', 'You',
      'color', '#01ADFF',
      'hand', (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'category', c.category,
            'imageUrl', c.image_url,
            'specs', c.specs
          )
          order by c.sort_order
        )
        from public.deck_cards c
        where c.deck_id = '${runtimeDeckId}'
          and c.sort_order in (1, 3, 5, 7, 9, 11, 13, 15)
      )
    ),
    jsonb_build_object(
      'id', 'p2',
      'name', 'Opponent',
      'color', '#C669FF',
      'hand', (
        select jsonb_agg(
          jsonb_build_object(
            'id', c.id,
            'code', c.code,
            'category', c.category,
            'imageUrl', c.image_url,
            'specs', c.specs
          )
          order by c.sort_order
        )
        from public.deck_cards c
        where c.deck_id = '${runtimeDeckId}'
          and c.sort_order in (2, 4, 6, 8, 10, 12, 14, 16)
      )
    )
  ),
  'selectedSpecKey', null,
  'selectedByPlayerId', null,
  'pendingTransfer', null,
  'loseTieRequest', null,
  'tieState', jsonb_build_object(
    'active', false,
    'rounds', 0,
    'potCards', '[]'::jsonb,
    'pendingLoseTieRequestId', null
  ),
  'version', 1,
  'updatedAt', now()::text
)
where id = '${runtimeSessionId}';

delete from public.decks where id = 'pirate-ships-v1';

commit;
`;
};

const main = async () => {
  const manifest = await loadManifest();
  const sql = renderSeed(manifest);
  await fs.writeFile(seedPath, sql, "utf8");
  process.stdout.write(`Updated ${seedPath}\n`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
