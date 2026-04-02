import { v4 as uuidv4 } from "uuid";
import { getDeckById, getDeckCards } from "../data/decks";
import type {
  ActionResponse,
  CardView,
  GameActionRequest,
  GameEvent,
  PlayerState,
  SessionState,
  SessionViewState
} from "../types/game";

export class GameActionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "GameActionError";
  }
}

const nowIso = () => new Date().toISOString();

const cloneState = (state: SessionState): SessionState => structuredClone(state);

const findPlayer = (state: SessionState, playerId: string): PlayerState => {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) {
    throw new GameActionError("Player not found in session.");
  }
  return player;
};

const getOpponent = (state: SessionState, playerId: string): PlayerState => {
  const opponent = state.players.find((entry) => entry.id !== playerId);
  if (!opponent) {
    throw new GameActionError("Opponent not found in session.");
  }
  return opponent;
};

const appendStateUpdated = (events: GameEvent[], state: SessionState, at: string) => {
  events.push({
    type: "state_updated",
    payload: { state: cloneState(state) },
    at
  });
};

const bumpSession = (state: SessionState, at: string) => {
  state.version += 1;
  state.updatedAt = at;
};

const removeTopCard = (player: PlayerState): CardView => {
  const top = player.hand.shift();
  if (!top) {
    throw new GameActionError("Player has no card to remove.");
  }
  return top;
};

const getTopCard = (player: PlayerState): CardView | null => player.hand[0] ?? null;

const maybeFinishGame = (state: SessionState) => {
  if (state.status !== "running") {
    return;
  }
  if (state.tieState.active || state.pendingTransfer || state.loseTieRequest) {
    return;
  }
  const winner = state.players.find((player) => player.hand.length > 0);
  const loser = state.players.find((player) => player.hand.length === 0);
  if (winner && loser) {
    state.status = "finished";
    state.winnerPlayerId = winner.id;
  }
};

export const createSessionView = (
  session: SessionState,
  currentPlayerId: string
): SessionViewState => {
  const you = findPlayer(session, currentPlayerId);
  const opponent = getOpponent(session, currentPlayerId);

  return {
    yourCount: you.hand.length,
    opponentCount: opponent.hand.length,
    yourTopCard: getTopCard(you),
    opponentTopCard: getTopCard(opponent),
    selectedSpecKey: session.selectedSpecKey,
    selectedByPlayerId: session.selectedByPlayerId,
    tieState: session.tieState,
    pendingTransfer: session.pendingTransfer,
    loseTieRequest: session.loseTieRequest
  };
};

const handleSelectSpec = (
  state: SessionState,
  req: Extract<GameActionRequest, { actionType: "SELECT_SPEC" }>,
  events: GameEvent[],
  at: string
) => {
  if (state.status !== "running") {
    throw new GameActionError("Game is not running.");
  }

  const actor = findPlayer(state, req.actorPlayerId);
  const topCard = getTopCard(actor);
  if (!topCard) {
    throw new GameActionError("You have no top card to select a spec from.");
  }

  const hasSpec = topCard.specs.some((spec) => spec.key === req.payload.specKey);
  if (!hasSpec) {
    throw new GameActionError("Selected spec is not available on your top card.");
  }

  state.selectedSpecKey = req.payload.specKey;
  state.selectedByPlayerId = req.actorPlayerId;

  events.push({
    type: "spec_selected",
    payload: {
      playerId: req.actorPlayerId,
      specKey: req.payload.specKey
    },
    at
  });
};

const handleSelectDeck = (
  state: SessionState,
  req: Extract<GameActionRequest, { actionType: "SELECT_DECK" }>
) => {
  if (state.status !== "lobby") {
    throw new GameActionError("Deck can only be selected in lobby.");
  }
  if (state.hostPlayerId !== req.actorPlayerId) {
    throw new GameActionError("Only host can select the deck.");
  }
  const deckId = req.payload.deckId.trim().toLowerCase();
  const deck = getDeckById(deckId);
  if (!deck) {
    throw new GameActionError("Deck was not found.");
  }
  if (deck.cardCount !== 32) {
    throw new GameActionError("Selected deck is not tournament-ready (32 cards required).");
  }
  state.deckId = deck.id;
};

const handleSendCard = (
  state: SessionState,
  req: Extract<GameActionRequest, { actionType: "SEND_CARD" }>,
  events: GameEvent[],
  at: string
) => {
  if (state.status !== "running") {
    throw new GameActionError("Game is not running.");
  }

  if (state.pendingTransfer) {
    throw new GameActionError("There is already a pending transfer request.");
  }

  const actor = findPlayer(state, req.actorPlayerId);
  const opponent = getOpponent(state, req.actorPlayerId);
  const topCard = getTopCard(actor);

  if (!topCard) {
    throw new GameActionError("You have no top card to send.");
  }

  if (topCard.id !== req.payload.cardId) {
    throw new GameActionError("Stale send request: top card changed.");
  }

  const transfer = {
    id: uuidv4(),
    fromPlayerId: actor.id,
    toPlayerId: opponent.id,
    cardId: topCard.id,
    status: "pending" as const
  };

  state.pendingTransfer = transfer;

  events.push({
    type: "transfer_requested",
    payload: transfer,
    at
  });
};

const handleRespondTransfer = (
  state: SessionState,
  req: Extract<GameActionRequest, { actionType: "RESPOND_TRANSFER" }>,
  events: GameEvent[],
  at: string
) => {
  if (state.status !== "running") {
    throw new GameActionError("Game is not running.");
  }

  const transfer = state.pendingTransfer;
  if (!transfer) {
    throw new GameActionError("No pending transfer request.");
  }

  if (transfer.id !== req.payload.requestId) {
    throw new GameActionError("Transfer request no longer valid.");
  }

  if (req.actorPlayerId !== transfer.toPlayerId) {
    throw new GameActionError("Only receiver can respond to transfer.");
  }

  const sender = findPlayer(state, transfer.fromPlayerId);
  const receiver = findPlayer(state, transfer.toPlayerId);

  if (req.payload.status === "accepted") {
    const senderTop = getTopCard(sender);
    const receiverTop = getTopCard(receiver);
    if (!senderTop || senderTop.id !== transfer.cardId) {
      throw new GameActionError("Transfer cannot be accepted because sender top card changed.");
    }
    if (!receiverTop) {
      throw new GameActionError("Transfer cannot be accepted because receiver has no top card.");
    }

    const movedReceiverTop = removeTopCard(receiver);
    const movedSenderTop = removeTopCard(sender);
    receiver.hand.push(movedReceiverTop, movedSenderTop);

    // New top cards are now in play, so both players must pick a fresh spec.
    state.selectedSpecKey = null;
    state.selectedByPlayerId = null;
  }

  state.pendingTransfer = null;

  events.push({
    type: "transfer_responded",
    payload: {
      requestId: transfer.id,
      status: req.payload.status,
      fromPlayerId: transfer.fromPlayerId,
      toPlayerId: transfer.toPlayerId
    },
    at
  });
};

const handleStartTie = (
  state: SessionState,
  _req: Extract<GameActionRequest, { actionType: "START_TIE" }>,
  events: GameEvent[],
  at: string
) => {
  if (state.status !== "running") {
    throw new GameActionError("Game is not running.");
  }

  if (state.pendingTransfer) {
    throw new GameActionError("Resolve pending transfer before starting tie.");
  }

  const [playerA, playerB] = state.players;
  if (!playerA || !playerB) {
    throw new GameActionError("Tie requires exactly two players.");
  }

  if (playerA.hand.length === 0 || playerB.hand.length === 0) {
    throw new GameActionError("Both players need a top card for tie mode.");
  }

  const cardA = removeTopCard(playerA);
  const cardB = removeTopCard(playerB);

  state.tieState.active = true;
  state.tieState.rounds += 1;
  state.tieState.potCards.push(cardA, cardB);
  state.selectedSpecKey = null;
  state.selectedByPlayerId = null;

  events.push({
    type: "tie_started",
    payload: {
      rounds: state.tieState.rounds,
      potSize: state.tieState.potCards.length
    },
    at
  });
};

const handleLoseTie = (
  state: SessionState,
  req: Extract<GameActionRequest, { actionType: "LOSE_TIE" }>,
  events: GameEvent[],
  at: string
) => {
  if (state.status !== "running") {
    throw new GameActionError("Game is not running.");
  }

  if (!state.tieState.active) {
    throw new GameActionError("Tie is not active.");
  }

  if (state.loseTieRequest) {
    throw new GameActionError("There is already a pending lose-tie request.");
  }

  if (req.payload.winnerPlayerId === req.actorPlayerId) {
    throw new GameActionError("Winner player cannot equal losing player.");
  }

  const winner = findPlayer(state, req.payload.winnerPlayerId);
  findPlayer(state, req.actorPlayerId);

  const loseTieRequest = {
    id: uuidv4(),
    loserPlayerId: req.actorPlayerId,
    winnerPlayerId: winner.id,
    status: "pending" as const
  };

  state.loseTieRequest = loseTieRequest;
  state.tieState.pendingLoseTieRequestId = loseTieRequest.id;

  events.push({
    type: "tie_lost_requested",
    payload: loseTieRequest,
    at
  });
};

const clearTieRequest = (state: SessionState) => {
  state.loseTieRequest = null;
  state.tieState.pendingLoseTieRequestId = null;
};

const handleRespondTie = (
  state: SessionState,
  req: Extract<GameActionRequest, { actionType: "RESPOND_TIE" }>,
  events: GameEvent[],
  at: string
) => {
  if (state.status !== "running") {
    throw new GameActionError("Game is not running.");
  }

  const loseTieRequest = state.loseTieRequest;
  if (!loseTieRequest) {
    throw new GameActionError("No pending lose-tie request.");
  }

  if (loseTieRequest.id !== req.payload.requestId) {
    throw new GameActionError("Lose-tie request no longer valid.");
  }

  if (req.actorPlayerId !== loseTieRequest.winnerPlayerId) {
    throw new GameActionError("Only selected winner can respond.");
  }

  if (req.payload.status === "accepted") {
    const winner = findPlayer(state, loseTieRequest.winnerPlayerId);
    const loser = findPlayer(state, loseTieRequest.loserPlayerId);

    winner.hand.push(...state.tieState.potCards);

    const loserTop = getTopCard(loser);
    if (loserTop) {
      winner.hand.push(removeTopCard(loser));
    }

    state.tieState.potCards = [];
    state.tieState.active = false;
    state.tieState.rounds = 0;
    state.selectedSpecKey = null;
    state.selectedByPlayerId = null;
  }

  clearTieRequest(state);

  events.push({
    type: "tie_lost_responded",
    payload: {
      requestId: req.payload.requestId,
      status: req.payload.status
    },
    at
  });
};

const handleStartGame = (state: SessionState, actorPlayerId: string) => {
  if (state.status !== "lobby") {
    throw new GameActionError("Game already started.");
  }
  if (state.hostPlayerId !== actorPlayerId) {
    throw new GameActionError("Only host can start the game.");
  }
  if (state.players.length !== 2) {
    throw new GameActionError("Exactly two players are required.");
  }
  const selectedDeckId = state.deckId?.trim().toLowerCase() ?? "";
  if (!selectedDeckId) {
    throw new GameActionError("Select a deck before starting the game.");
  }
  const cards = getDeckCards(selectedDeckId);
  if (cards.length !== 32) {
    throw new GameActionError("Selected deck does not have the required 32 cards.");
  }
  const players = state.players.map((player) => ({
    ...player,
    hand: [] as CardView[]
  }));
  cards.forEach((card, index) => {
    const playerIndex = index % players.length;
    players[playerIndex].hand.push(card);
  });

  state.players = players;
  state.status = "running";
  state.winnerPlayerId = null;
};

export const applyGameAction = (
  inputState: SessionState,
  req: GameActionRequest
): ActionResponse => {
  if (req.expectedVersion !== inputState.version) {
    throw new GameActionError("Stale action rejected because session version changed.");
  }

  const state = cloneState(inputState);
  const events: GameEvent[] = [];
  const at = nowIso();

  switch (req.actionType) {
    case "START_GAME":
      handleStartGame(state, req.actorPlayerId);
      break;
    case "SELECT_DECK":
      handleSelectDeck(state, req);
      break;
    case "SELECT_SPEC":
      handleSelectSpec(state, req, events, at);
      break;
    case "SEND_CARD":
      handleSendCard(state, req, events, at);
      break;
    case "RESPOND_TRANSFER":
      handleRespondTransfer(state, req, events, at);
      break;
    case "START_TIE":
      handleStartTie(state, req, events, at);
      break;
    case "LOSE_TIE":
      handleLoseTie(state, req, events, at);
      break;
    case "RESPOND_TIE":
      handleRespondTie(state, req, events, at);
      break;
    default:
      throw new GameActionError("Unknown action type.");
  }

  maybeFinishGame(state);
  bumpSession(state, at);
  appendStateUpdated(events, state, at);

  return {
    state,
    events,
    appliedVersion: state.version,
    latestEventId: 0
  };
};
