import contentManifest from "../../content/decks/content-manifest.json";
import type { CardView, DeckCatalogItem, SpecField } from "../types/game";

type ManifestSpec = {
  key: string;
  label: string;
  unit: string;
  value: number;
  icon: string;
  caption?: string;
  estimated?: boolean;
  sourceUrl?: string;
  displayPrecision?: number;
};

type ManifestCard = {
  code: string;
  name: string;
  localImageUrl: string;
  specs?: ManifestSpec[];
};

type ManifestDeck = {
  id: string;
  name: string;
  description?: string;
  isHidden?: boolean;
  accessCode?: string;
  idPrefix?: string;
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
  "military-submarines-v1": "Nuclear and diesel-electric attack boats from major naval fleets.",
  "gemeinde-quartett-v1": "Menschen aus der Gemeinde als verstecktes Sonderdeck."
};

const DECK_ID_PREFIX: Record<string, string> = {
  "military-jets-v1": "miljet",
  "supercars-v1": "supercar",
  "military-submarines-v1": "sub",
  "gemeinde-quartett-v1": "gemeinde"
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

const sanitizeSpec = (spec: ManifestSpec): SpecField => {
  const value = Number.isFinite(spec.value) ? spec.value : 0;
  return {
    key: spec.key,
    label: spec.label,
    unit: spec.unit,
    value,
    icon: spec.icon,
    caption: spec.caption,
    estimated: spec.estimated,
    sourceUrl: spec.sourceUrl,
    displayPrecision: typeof spec.displayPrecision === "number" ? spec.displayPrecision : undefined
  };
};

const toCardId = (deckId: string, code: string): string => {
  const manifestDeck = sortedDecks.find((deck) => deck.id === deckId);
  const prefix = manifestDeck?.idPrefix ?? DECK_ID_PREFIX[deckId] ?? deckId;
  return `${prefix}-${code}`;
};

const sortedDecks = [...manifest.decks].sort((a, b) => sortDeckIds(a.id, b.id));

export const deckCatalog: DeckCatalogItem[] = sortedDecks.map((deck) => ({
  id: deck.id,
  name: deck.name,
  description: deck.description ?? DECK_DESCRIPTIONS[deck.id] ?? "",
  coverImageUrl: deck.cards[0]?.localImageUrl ?? `/decks/${deck.id}/01.jpg`,
  cardCount: deck.cards.length,
  isHidden: Boolean(deck.isHidden)
}));

export const allDeckCatalog: DeckCatalogItem[] = [...deckCatalog];
const accessCodeByDeckId: Record<string, string> = Object.fromEntries(
  sortedDecks
    .map((deck) => [deck.id, typeof deck.accessCode === "string" ? deck.accessCode.trim() : ""] as const)
    .filter(([, code]) => Boolean(code))
);

export const cardsByDeckId: Record<string, CardView[]> = Object.fromEntries(
  sortedDecks.map((deck) => [
    deck.id,
    deck.cards.map((card) => ({
      id: toCardId(deck.id, card.code),
      code: card.code,
      category: card.name,
      imageUrl: card.localImageUrl,
      specs: (card.specs ?? []).map(sanitizeSpec)
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

export const getDeckByAccessCode = (code: string | null | undefined): DeckCatalogItem | null => {
  const normalized = typeof code === "string" ? code.trim() : "";
  if (!normalized) {
    return null;
  }
  const deckId = Object.entries(accessCodeByDeckId).find(([, accessCode]) => accessCode === normalized)?.[0];
  if (!deckId) {
    return null;
  }
  return allDeckCatalog.find((deck) => deck.id === deckId) ?? null;
};
