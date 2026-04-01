import { getDeckCards } from "../data/decks";
import type { CardView, SessionState } from "../types/game";

const splitDeckForTwoPlayers = (cards: CardView[]): [CardView[], CardView[]] => {
  const p1: CardView[] = [];
  const p2: CardView[] = [];

  cards.forEach((card, index) => {
    if (index % 2 === 0) {
      p1.push(card);
      return;
    }
    p2.push(card);
  });

  return [p1, p2];
};

export const createMockSessionState = (sessionId = "demo-session-01"): SessionState => {
  const defaultDeckId = "military-jets-v1";
  const cards = getDeckCards(defaultDeckId);
  const [cardsP1, cardsP2] = splitDeckForTwoPlayers(cards);

  return {
    sessionId,
    sessionCode: "DEMO01",
    status: "running",
    hostPlayerId: "p1",
    deckId: defaultDeckId,
    winnerPlayerId: null,
    players: [
      {
        id: "p1",
        name: "Player 1",
        color: "#01ADFF",
        hand: cardsP1
      },
      {
        id: "p2",
        name: "Player 2",
        color: "#C669FF",
        hand: cardsP2
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
  };
};

export const initialMockState: SessionState = createMockSessionState();

export const cloneSessionState = (state: SessionState): SessionState => {
  return structuredClone(state);
};

