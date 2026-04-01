import type { CardView, DeckCatalogItem, SpecField } from "../types/game";

type DeckSeedCard = {
  name: string;
  tier: number;
};

type DeckSeed = {
  id: string;
  name: string;
  description: string;
  isHidden: boolean;
  cards: DeckSeedCard[];
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const seededOffset = (seed: string, min: number, max: number): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const span = max - min + 1;
  const normalized = Math.abs(hash) % span;
  return min + normalized;
};

const makeJetSpecs = (name: string, tier: number): SpecField[] => {
  const speed = clamp(56 + tier * 8 + seededOffset(`speed:${name}`, -6, 6), 1, 100);
  const range = clamp(50 + tier * 7 + seededOffset(`range:${name}`, -7, 7), 1, 100);
  const payload = clamp(45 + tier * 8 + seededOffset(`payload:${name}`, -8, 8), 1, 100);
  const ceiling = clamp(54 + tier * 8 + seededOffset(`ceiling:${name}`, -6, 6), 1, 100);
  const agility = clamp(52 + tier * 7 + seededOffset(`agility:${name}`, -8, 8), 1, 100);
  const stealth = clamp(40 + tier * 10 + seededOffset(`stealth:${name}`, -12, 12), 1, 100);

  return [
    { key: "speed", label: "Speed", value: speed },
    { key: "range", label: "Range", value: range },
    { key: "payload", label: "Payload", value: payload },
    { key: "ceiling", label: "Ceiling", value: ceiling },
    { key: "agility", label: "Agility", value: agility },
    { key: "stealth", label: "Stealth", value: stealth }
  ];
};

const makeCarSpecs = (name: string, tier: number): SpecField[] => {
  const topSpeed = clamp(58 + tier * 8 + seededOffset(`topspeed:${name}`, -7, 7), 1, 100);
  const acceleration = clamp(54 + tier * 8 + seededOffset(`accel:${name}`, -8, 8), 1, 100);
  const power = clamp(55 + tier * 9 + seededOffset(`power:${name}`, -6, 6), 1, 100);
  const handling = clamp(52 + tier * 8 + seededOffset(`handling:${name}`, -7, 7), 1, 100);
  const braking = clamp(50 + tier * 8 + seededOffset(`braking:${name}`, -8, 8), 1, 100);
  const rarity = clamp(44 + tier * 10 + seededOffset(`rarity:${name}`, -9, 9), 1, 100);

  return [
    { key: "top_speed", label: "Top Speed", value: topSpeed },
    { key: "acceleration", label: "Acceleration", value: acceleration },
    { key: "power", label: "Power", value: power },
    { key: "handling", label: "Handling", value: handling },
    { key: "braking", label: "Braking", value: braking },
    { key: "rarity", label: "Rarity", value: rarity }
  ];
};

const makeSubSpecs = (name: string, tier: number): SpecField[] => {
  const submergedSpeed = clamp(50 + tier * 8 + seededOffset(`sspeed:${name}`, -7, 7), 1, 100);
  const diveDepth = clamp(53 + tier * 8 + seededOffset(`depth:${name}`, -8, 8), 1, 100);
  const endurance = clamp(55 + tier * 7 + seededOffset(`endur:${name}`, -6, 6), 1, 100);
  const quietness = clamp(52 + tier * 9 + seededOffset(`quiet:${name}`, -8, 8), 1, 100);
  const firepower = clamp(50 + tier * 9 + seededOffset(`fire:${name}`, -7, 7), 1, 100);
  const sensors = clamp(50 + tier * 8 + seededOffset(`sensor:${name}`, -7, 7), 1, 100);

  return [
    { key: "submerged_speed", label: "Sub Speed", value: submergedSpeed },
    { key: "dive_depth", label: "Dive Depth", value: diveDepth },
    { key: "endurance", label: "Endurance", value: endurance },
    { key: "quietness", label: "Quietness", value: quietness },
    { key: "firepower", label: "Firepower", value: firepower },
    { key: "sensors", label: "Sensors", value: sensors }
  ];
};

const deckSeeds: DeckSeed[] = [
  {
    id: "military-jets-v1",
    name: "Military Jets",
    description: "Air-superiority icons and strike aircraft from modern military aviation.",
    isHidden: false,
    cards: [
      { name: "F-22 Raptor", tier: 5 },
      { name: "F-35 Lightning II", tier: 5 },
      { name: "Eurofighter Typhoon", tier: 5 },
      { name: "Dassault Rafale", tier: 5 },
      { name: "Gripen E", tier: 4 },
      { name: "F-15 Eagle", tier: 4 },
      { name: "F-16 Fighting Falcon", tier: 4 },
      { name: "F/A-18 Super Hornet", tier: 4 },
      { name: "F/A-18 Hornet", tier: 4 },
      { name: "Su-57 Felon", tier: 5 },
      { name: "Su-35S", tier: 4 },
      { name: "Su-30SM", tier: 4 },
      { name: "Su-27 Flanker", tier: 4 },
      { name: "MiG-29 Fulcrum", tier: 4 },
      { name: "MiG-31 Foxhound", tier: 4 },
      { name: "Mirage 2000", tier: 3 },
      { name: "Tornado ADV", tier: 3 },
      { name: "F-14 Tomcat", tier: 4 },
      { name: "F-117 Nighthawk", tier: 4 },
      { name: "A-10 Thunderbolt II", tier: 3 },
      { name: "MiG-21", tier: 2 },
      { name: "MiG-25 Foxbat", tier: 3 },
      { name: "J-20 Mighty Dragon", tier: 5 },
      { name: "J-10C", tier: 4 },
      { name: "FC-31 Gyrfalcon", tier: 4 },
      { name: "HAL Tejas Mk1A", tier: 3 },
      { name: "KAI KF-21", tier: 4 },
      { name: "F-5 Tiger II", tier: 2 },
      { name: "Su-34 Fullback", tier: 4 },
      { name: "SEPECAT Jaguar", tier: 2 },
      { name: "Yak-141", tier: 3 },
      { name: "Harrier II", tier: 3 }
    ]
  },
  {
    id: "supercars-v1",
    name: "Supercars",
    description: "Hypercar legends and track-focused road missiles.",
    isHidden: false,
    cards: [
      { name: "Bugatti Chiron Super Sport", tier: 5 },
      { name: "Bugatti Veyron Super Sport", tier: 5 },
      { name: "Koenigsegg Jesko", tier: 5 },
      { name: "Koenigsegg Regera", tier: 5 },
      { name: "Koenigsegg Agera RS", tier: 5 },
      { name: "Rimac Nevera", tier: 5 },
      { name: "Ferrari LaFerrari", tier: 5 },
      { name: "Ferrari SF90 Stradale", tier: 5 },
      { name: "Ferrari 812 Superfast", tier: 4 },
      { name: "Ferrari Enzo", tier: 4 },
      { name: "Lamborghini Revuelto", tier: 5 },
      { name: "Lamborghini Aventador SVJ", tier: 4 },
      { name: "Lamborghini Huracan STO", tier: 4 },
      { name: "McLaren P1", tier: 5 },
      { name: "McLaren 720S", tier: 4 },
      { name: "McLaren Senna", tier: 5 },
      { name: "Porsche 918 Spyder", tier: 5 },
      { name: "Porsche Carrera GT", tier: 4 },
      { name: "Pagani Huayra", tier: 4 },
      { name: "Pagani Zonda R", tier: 4 },
      { name: "Aston Martin Valkyrie", tier: 5 },
      { name: "Mercedes-AMG One", tier: 5 },
      { name: "Ford GT", tier: 4 },
      { name: "Chevrolet Corvette Z06", tier: 3 },
      { name: "Nissan GT-R Nismo", tier: 3 },
      { name: "Lexus LFA", tier: 3 },
      { name: "Audi R8 V10", tier: 3 },
      { name: "Honda NSX", tier: 3 },
      { name: "Maserati MC20", tier: 3 },
      { name: "Dodge Viper ACR", tier: 3 },
      { name: "Lotus Evija", tier: 4 },
      { name: "SSC Tuatara", tier: 5 }
    ]
  },
  {
    id: "military-submarines-v1",
    name: "Military Submarines",
    description: "Nuclear and diesel-electric attack boats from major naval fleets.",
    isHidden: false,
    cards: [
      { name: "Virginia-class", tier: 5 },
      { name: "Seawolf-class", tier: 5 },
      { name: "Los Angeles-class", tier: 4 },
      { name: "Columbia-class", tier: 5 },
      { name: "Ohio-class", tier: 5 },
      { name: "Astute-class", tier: 5 },
      { name: "Vanguard-class", tier: 4 },
      { name: "Trafalgar-class", tier: 4 },
      { name: "Triomphant-class", tier: 5 },
      { name: "Rubis-class", tier: 3 },
      { name: "Barracuda-class", tier: 4 },
      { name: "Type 212A", tier: 4 },
      { name: "Type 214", tier: 4 },
      { name: "Type 209", tier: 3 },
      { name: "Yuan-class", tier: 4 },
      { name: "Shang-class", tier: 4 },
      { name: "Jin-class", tier: 4 },
      { name: "Kilo-class", tier: 4 },
      { name: "Lada-class", tier: 3 },
      { name: "Yasen-class", tier: 5 },
      { name: "Borei-class", tier: 5 },
      { name: "Akula-class", tier: 4 },
      { name: "Typhoon-class", tier: 4 },
      { name: "Sierra-class", tier: 3 },
      { name: "Delta IV-class", tier: 4 },
      { name: "Romeo-class", tier: 2 },
      { name: "Scorpene-class", tier: 4 },
      { name: "Soryu-class", tier: 4 },
      { name: "Taigei-class", tier: 4 },
      { name: "Collins-class", tier: 3 },
      { name: "Gotland-class", tier: 4 },
      { name: "Dolphin-class", tier: 4 }
    ]
  }
];

const buildCardCode = (index: number) => `${String(index + 1).padStart(2, "0")}`;

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const makeCards = (deck: DeckSeed): CardView[] => {
  return deck.cards.map((seed, index) => {
    const code = buildCardCode(index);
    const id = `${deck.id}-${toSlug(seed.name)}`;
    const imageUrl = `/decks/${deck.id}/${code}.svg`;

    const specs =
      deck.id === "military-jets-v1"
        ? makeJetSpecs(seed.name, seed.tier)
        : deck.id === "supercars-v1"
          ? makeCarSpecs(seed.name, seed.tier)
          : makeSubSpecs(seed.name, seed.tier);

    return {
      id,
      code,
      category: seed.name,
      imageUrl,
      specs
    };
  });
};

export const deckCatalog: DeckCatalogItem[] = deckSeeds.map((deck) => ({
  id: deck.id,
  name: deck.name,
  description: deck.description,
  coverImageUrl: `/decks/${deck.id}/01.svg`,
  cardCount: deck.cards.length,
  isHidden: deck.isHidden
}));

const hiddenDeckCatalog: DeckCatalogItem[] = [
  {
    id: "pirate-ships-v1",
    name: "Pirate Ships",
    description: "Hidden legacy deck only accessible via exact deck ID.",
    coverImageUrl: "/decks/military-jets-v1/01.svg",
    cardCount: 6,
    isHidden: true
  }
];

export const allDeckCatalog: DeckCatalogItem[] = [...deckCatalog, ...hiddenDeckCatalog];

export const cardsByDeckId: Record<string, CardView[]> = Object.fromEntries(
  deckSeeds.map((deck) => [deck.id, makeCards(deck)])
);

export const getDeckCards = (deckId: string): CardView[] => {
  return structuredClone(cardsByDeckId[deckId] ?? []);
};

export const getDeckById = (deckId: string): DeckCatalogItem | null => {
  const normalized = deckId.trim().toLowerCase();
  return allDeckCatalog.find((deck) => deck.id.toLowerCase() === normalized) ?? null;
};

export const getVisibleDecks = (): DeckCatalogItem[] => {
  return allDeckCatalog.filter((deck) => !deck.isHidden);
};
