import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const manifestPath = path.join(projectRoot, "content/decks/content-manifest.json");

const DECK_ORDER = ["military-jets-v1", "supercars-v1", "military-submarines-v1"];
const DECK_ORDER_INDEX = new Map(DECK_ORDER.map((deckId, index) => [deckId, index]));

const DECK_DESCRIPTIONS = {
  "military-jets-v1": "Air-superiority icons and strike aircraft from modern military aviation.",
  "supercars-v1": "Hypercar legends and track-focused road missiles.",
  "military-submarines-v1": "Nuclear and diesel-electric attack boats from major naval fleets.",
  "gemeinde-quartett-v1": "Menschen aus der Gemeinde als verstecktes Sonderdeck."
};

const DECK_ID_PREFIX = {
  "military-jets-v1": "miljet",
  "supercars-v1": "supercar",
  "military-submarines-v1": "sub",
  "gemeinde-quartett-v1": "gemeinde"
};

const chunk = (items, size) => {
  const out = [];
  for (let i = 0; i < items.length; i += size) {
    out.push(items.slice(i, i + size));
  }
  return out;
};

const toSortRank = (deckId) => DECK_ORDER_INDEX.get(deckId) ?? Number.POSITIVE_INFINITY;

const loadManifestDecks = async () => {
  const raw = await fs.readFile(manifestPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!Array.isArray(parsed.decks) || parsed.decks.length === 0) {
    throw new Error("Manifest has no decks.");
  }

  const decks = parsed.decks
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
      throw new Error(`Deck ${deck.id} must have exactly 32 cards.`);
    }
  }

  return decks;
};

const toDeckCardsRows = (decks) => {
  const rows = [];
  for (const deck of decks) {
    const prefix = deck.idPrefix ?? DECK_ID_PREFIX[deck.id] ?? deck.id;
    for (const card of deck.cards) {
      if (!Array.isArray(card.specs) || card.specs.length === 0) {
        throw new Error(`Card ${deck.id}/${card.code} must define at least one spec.`);
      }
      const code = String(card.code).padStart(2, "0");
      rows.push({
        id: `${prefix}-${code}`,
        deck_id: deck.id,
        code,
        category: card.name,
        image_url: card.localImageUrl,
        specs: card.specs,
        sort_order: Number.parseInt(code, 10)
      });
    }
  }
  return rows;
};

const requiredEnv = (name) => {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};

const run = async () => {
  const supabaseUrl = requiredEnv("SUPABASE_URL");
  const serviceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");
  const client = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const decks = await loadManifestDecks();
  const deckRows = decks.map((deck) => ({
    id: deck.id,
    name: deck.name,
    description: deck.description ?? DECK_DESCRIPTIONS[deck.id] ?? "",
    cover_image_url: deck.cards[0]?.localImageUrl ?? `/decks/${deck.id}/01.jpg`,
    is_hidden: deck.isHidden === true,
    access_code: typeof deck.accessCode === "string" && deck.accessCode.trim() ? deck.accessCode.trim() : null,
    is_builtin: true
  }));

  const deckCardsRows = toDeckCardsRows(decks);
  const managedDeckIds = deckRows.map((deck) => deck.id);

  const { error: upsertDeckError } = await client.from("decks").upsert(deckRows);
  if (upsertDeckError) {
    throw new Error(`Failed to upsert decks: ${upsertDeckError.message}`);
  }

  const { error: deleteDeckCardsError } = await client.from("deck_cards").delete().in("deck_id", [...managedDeckIds, "pirate-ships-v1"]);
  if (deleteDeckCardsError) {
    throw new Error(`Failed to clear deck_cards: ${deleteDeckCardsError.message}`);
  }

  for (const batch of chunk(deckCardsRows, 64)) {
    const { error } = await client.from("deck_cards").insert(batch);
    if (error) {
      throw new Error(`Failed to insert deck card batch: ${error.message}`);
    }
  }

  const runtimeSessionId = "11111111-1111-1111-1111-111111111111";
  const runtimeDeckId = decks.find((deck) => deck.isHidden !== true)?.id ?? decks[0].id;
  const runtimeNow = new Date().toISOString();

  await client.from("game_events").delete().eq("session_id", runtimeSessionId);
  await client.from("game_players").delete().eq("session_id", runtimeSessionId);
  await client.from("game_sessions").delete().eq("id", runtimeSessionId);
  await client.from("game_sessions").delete().eq("session_code", "QRT001");

  const { error: insertSessionError } = await client.from("game_sessions").insert({
    id: runtimeSessionId,
    session_code: "QRT001",
    status: "running",
    host_player_id: "p1",
    deck_id: runtimeDeckId,
    winner_player_id: null,
    state: {},
    version: 1,
    created_at: runtimeNow,
    updated_at: runtimeNow
  });
  if (insertSessionError) {
    throw new Error(`Failed to insert runtime session: ${insertSessionError.message}`);
  }

  const { error: insertPlayersError } = await client.from("game_players").insert([
    {
      id: "p1",
      session_id: runtimeSessionId,
      player_name: "You",
      color: "#01ADFF",
      is_host: true,
      seat_index: 1
    },
    {
      id: "p2",
      session_id: runtimeSessionId,
      player_name: "Opponent",
      color: "#C669FF",
      is_host: false,
      seat_index: 2
    }
  ]);
  if (insertPlayersError) {
    throw new Error(`Failed to insert runtime players: ${insertPlayersError.message}`);
  }

  const runtimeDeckCards = deckCardsRows.filter((row) => row.deck_id === runtimeDeckId);
  const toCardView = (row) => ({
    id: row.id,
    code: row.code,
    category: row.category,
    imageUrl: row.image_url,
    specs: row.specs
  });

  const handOne = runtimeDeckCards.filter((row) => [1, 3, 5, 7, 9, 11, 13, 15].includes(row.sort_order)).map(toCardView);
  const handTwo = runtimeDeckCards.filter((row) => [2, 4, 6, 8, 10, 12, 14, 16].includes(row.sort_order)).map(toCardView);

  const runtimeState = {
    sessionId: runtimeSessionId,
    sessionCode: "QRT001",
    status: "running",
    hostPlayerId: "p1",
    deckId: runtimeDeckId,
    winnerPlayerId: null,
    players: [
      {
        id: "p1",
        name: "You",
        color: "#01ADFF",
        hand: handOne
      },
      {
        id: "p2",
        name: "Opponent",
        color: "#C669FF",
        hand: handTwo
      }
    ],
    selectedSpecKey: null,
    selectedByPlayerId: null,
    pendingTransfer: null,
    loseTieRequest: null,
    tieState: {
      active: false,
      rounds: 0,
      potCards: [],
      pendingLoseTieRequestId: null
    },
    version: 1,
    updatedAt: runtimeNow
  };

  const { error: updateSessionError } = await client
    .from("game_sessions")
    .update({
      deck_id: runtimeDeckId,
      state: runtimeState,
      status: "running",
      version: 1,
      updated_at: runtimeNow
    })
    .eq("id", runtimeSessionId);
  if (updateSessionError) {
    throw new Error(`Failed to update runtime state: ${updateSessionError.message}`);
  }

  await client.from("decks").delete().eq("id", "pirate-ships-v1");

  process.stdout.write(
    `Reseeded remote deck data.\nDecks: ${deckRows.length}\nDeck cards: ${deckCardsRows.length}\nRuntime deck: ${runtimeDeckId}\n`
  );
};

run().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
