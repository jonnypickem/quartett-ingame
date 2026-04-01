import contentManifest from "../../content/decks/content-manifest.json";
import type { CardView, DeckCatalogItem, SpecField } from "../types/game";

type ManifestCard = {
  code: string;
  name: string;
  localImageUrl: string;
  specsNormalized: Record<string, number>;
};

type ManifestDeck = {
  id: string;
  name: string;
  cards: ManifestCard[];
};

type ManifestShape = {
  decks: ManifestDeck[];
};

const manifest = contentManifest as ManifestShape;

const DECK_ORDER = ["military-jets-v1", "supercars-v1", "military-submarines-v1"] as const;
const DECK_ORDER_INDEX = new Map<string, number>(DECK_ORDER.map((deckId, index) => [deckId, index]));

const DECK_DESCRIPTIONS: Record<string, string> = {
  "military-jets-v1": "Air-superiority icons and strike aircraft from modern military aviation.",
  "supercars-v1": "Hypercar legends and track-focused road missiles.",
  "military-submarines-v1": "Nuclear and diesel-electric attack boats from major naval fleets."
};

const DECK_ID_PREFIX: Record<string, string> = {
  "military-jets-v1": "miljet",
  "supercars-v1": "supercar",
  "military-submarines-v1": "sub"
};

const DECK_SPEC_KEYS: Record<string, string[]> = {
  "military-jets-v1": ["speed", "range", "payload", "ceiling", "agility", "stealth"],
  "supercars-v1": ["top_speed", "acceleration", "power", "handling", "braking", "rarity"],
  "military-submarines-v1": ["submerged_speed", "dive_depth", "endurance", "quietness", "firepower", "sensors"]
};

const SPEC_LABELS: Record<string, string> = {
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

const normalizeDeckId = (deckId: unknown): string => {
  if (typeof deckId !== "string") {
    return "";
  }
  return deckId.trim().toLowerCase();
};

const sortDeckIds = (a: string, b: string): number => {
  const rankA = DECK_ORDER_INDEX.get(a) ?? Number.POSITIVE_INFINITY;
  const rankB = DECK_ORDER_INDEX.get(b) ?? Number.POSITIVE_INFINITY;
  if (rankA !== rankB) {
    return rankA - rankB;
  }
  return a.localeCompare(b);
};

const toSpecFields = (deckId: string, specsNormalized: Record<string, number>): SpecField[] => {
  const keys = DECK_SPEC_KEYS[deckId] ?? Object.keys(specsNormalized);
  return keys
    .filter((key) => typeof specsNormalized[key] === "number")
    .map((key) => ({
      key,
      label: SPEC_LABELS[key] ?? key,
      value: Math.max(1, Math.min(100, Math.round(specsNormalized[key])))
    }));
};

const toCardId = (deckId: string, code: string): string => {
  const prefix = DECK_ID_PREFIX[deckId] ?? deckId;
  return `${prefix}-${code}`;
};

const sortedDecks = [...manifest.decks].sort((a, b) => sortDeckIds(a.id, b.id));

export const deckCatalog: DeckCatalogItem[] = sortedDecks.map((deck) => ({
  id: deck.id,
  name: deck.name,
  description: DECK_DESCRIPTIONS[deck.id] ?? "",
  coverImageUrl: deck.cards[0]?.localImageUrl ?? `/decks/${deck.id}/01.jpg`,
  cardCount: deck.cards.length,
  isHidden: false
}));

export const allDeckCatalog: DeckCatalogItem[] = [...deckCatalog];

export const cardsByDeckId: Record<string, CardView[]> = Object.fromEntries(
  sortedDecks.map((deck) => [
    deck.id,
    deck.cards.map((card) => ({
      id: toCardId(deck.id, card.code),
      code: card.code,
      category: card.name,
      imageUrl: card.localImageUrl,
      specs: toSpecFields(deck.id, card.specsNormalized)
    }))
  ])
);

export const sortDeckCatalog = (decks: DeckCatalogItem[]): DeckCatalogItem[] => {
  return [...decks].sort((left, right) => sortDeckIds(left.id, right.id));
};

export const getDeckCards = (deckId: string): CardView[] => {
  const normalized = normalizeDeckId(deckId);
  return structuredClone(cardsByDeckId[normalized] ?? []);
};

export const getDeckById = (deckId: string | null | undefined): DeckCatalogItem | null => {
  const normalized = normalizeDeckId(deckId);
  if (!normalized) {
    return null;
  }
  return allDeckCatalog.find((deck) => deck.id === normalized) ?? null;
};

export const getVisibleDecks = (): DeckCatalogItem[] => {
  return allDeckCatalog.filter((deck) => !deck.isHidden);
};
