import type { CardView, SessionState } from "../types/game";

const cardsP1: CardView[] = [
  {
    id: "card-a1",
    code: "A1",
    category: "Pirate Ships",
    imageUrl:
      "https://images.unsplash.com/photo-1517999349371-c43520457b23?auto=format&fit=crop&w=900&q=80",
    specs: [
      { key: "speed", label: "Speed", value: 78 },
      { key: "armor", label: "Armor", value: 61 },
      { key: "firepower", label: "Firepower", value: 73 },
      { key: "crew", label: "Crew", value: 88 },
      { key: "luck", label: "Luck", value: 64 },
      { key: "range", label: "Range", value: 71 },
      { key: "stealth", label: "Stealth", value: 53 },
      { key: "cargo", label: "Cargo", value: 69 }
    ]
  },
  {
    id: "card-a2",
    code: "A2",
    category: "Pirate Ships",
    imageUrl:
      "https://images.unsplash.com/photo-1454789548928-9efd52dc4031?auto=format&fit=crop&w=900&q=80",
    specs: [
      { key: "speed", label: "Speed", value: 81 },
      { key: "armor", label: "Armor", value: 52 },
      { key: "firepower", label: "Firepower", value: 67 },
      { key: "crew", label: "Crew", value: 74 },
      { key: "luck", label: "Luck", value: 70 },
      { key: "range", label: "Range", value: 66 }
    ]
  },
  {
    id: "card-a3",
    code: "A3",
    category: "Pirate Ships",
    imageUrl:
      "https://images.unsplash.com/photo-1469844796476-19ebf3ab8f57?auto=format&fit=crop&w=900&q=80",
    specs: [
      { key: "speed", label: "Speed", value: 75 },
      { key: "armor", label: "Armor", value: 79 },
      { key: "firepower", label: "Firepower", value: 72 },
      { key: "crew", label: "Crew", value: 83 },
      { key: "luck", label: "Luck", value: 49 },
      { key: "range", label: "Range", value: 65 },
      { key: "stealth", label: "Stealth", value: 62 }
    ]
  }
];

const cardsP2: CardView[] = [
  {
    id: "card-b1",
    code: "B1",
    category: "Pirate Ships",
    imageUrl:
      "https://images.unsplash.com/photo-1500930287596-c1ecaa373bb2?auto=format&fit=crop&w=900&q=80",
    specs: [
      { key: "speed", label: "Speed", value: 74 },
      { key: "armor", label: "Armor", value: 68 },
      { key: "firepower", label: "Firepower", value: 80 },
      { key: "crew", label: "Crew", value: 82 },
      { key: "luck", label: "Luck", value: 56 },
      { key: "range", label: "Range", value: 71 },
      { key: "stealth", label: "Stealth", value: 54 },
      { key: "cargo", label: "Cargo", value: 71 }
    ]
  },
  {
    id: "card-b2",
    code: "B2",
    category: "Pirate Ships",
    imageUrl:
      "https://images.unsplash.com/photo-1516541196182-6bdb0516ed27?auto=format&fit=crop&w=900&q=80",
    specs: [
      { key: "speed", label: "Speed", value: 84 },
      { key: "armor", label: "Armor", value: 55 },
      { key: "firepower", label: "Firepower", value: 63 },
      { key: "crew", label: "Crew", value: 76 },
      { key: "luck", label: "Luck", value: 72 },
      { key: "range", label: "Range", value: 68 }
    ]
  },
  {
    id: "card-b3",
    code: "B3",
    category: "Pirate Ships",
    imageUrl:
      "https://images.unsplash.com/photo-1473447772217-3260a431d0d4?auto=format&fit=crop&w=900&q=80",
    specs: [
      { key: "speed", label: "Speed", value: 70 },
      { key: "armor", label: "Armor", value: 81 },
      { key: "firepower", label: "Firepower", value: 75 },
      { key: "crew", label: "Crew", value: 77 },
      { key: "luck", label: "Luck", value: 59 },
      { key: "range", label: "Range", value: 62 },
      { key: "stealth", label: "Stealth", value: 66 }
    ]
  }
];

export const createMockSessionState = (sessionId = "demo-session-01"): SessionState => ({
  sessionId,
  players: [
    {
      id: "p1",
      name: "You",
      color: "#01ADFF",
      hand: structuredClone(cardsP1)
    },
    {
      id: "p2",
      name: "Opponent",
      color: "#C669FF",
      hand: structuredClone(cardsP2)
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
  updatedAt: new Date().toISOString()
});

export const initialMockState: SessionState = createMockSessionState();

export const cloneSessionState = (state: SessionState): SessionState => {
  return structuredClone(state);
};
