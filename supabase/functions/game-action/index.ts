import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

type RequestStatus = "pending" | "accepted" | "declined";
type SessionStatus = "lobby" | "running" | "finished";

type GameActionType =
  | "START_GAME"
  | "SELECT_SPEC"
  | "SEND_CARD"
  | "RESPOND_TRANSFER"
  | "START_TIE"
  | "LOSE_TIE"
  | "RESPOND_TIE";

interface SpecField {
  key: string;
  label: string;
  value: number;
}

interface CardView {
  id: string;
  code: string;
  category: string;
  imageUrl: string;
  specs: SpecField[];
}

interface PlayerState {
  id: string;
  name: string;
  color: string;
  hand: CardView[];
}

interface TransferRequest {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  cardId: string;
  status: RequestStatus;
}

interface LoseTieRequest {
  id: string;
  loserPlayerId: string;
  winnerPlayerId: string;
  status: RequestStatus;
}

interface TieState {
  active: boolean;
  rounds: number;
  potCards: CardView[];
  pendingLoseTieRequestId: string | null;
}

interface SessionState {
  sessionId: string;
  sessionCode: string;
  status: SessionStatus;
  hostPlayerId: string;
  deckId: string;
  winnerPlayerId: string | null;
  players: PlayerState[];
  selectedSpecKey: string | null;
  selectedByPlayerId: string | null;
  pendingTransfer: TransferRequest | null;
  loseTieRequest: LoseTieRequest | null;
  tieState: TieState;
  version: number;
  updatedAt: string;
}

type GameActionRequest =
  | {
      sessionId: string;
      actorPlayerId: string;
      expectedVersion: number;
      actionType: "START_GAME";
      payload: Record<string, never>;
    }
  | {
      sessionId: string;
      actorPlayerId: string;
      expectedVersion: number;
      actionType: "SELECT_SPEC";
      payload: { specKey: string };
    }
  | {
      sessionId: string;
      actorPlayerId: string;
      expectedVersion: number;
      actionType: "SEND_CARD";
      payload: { cardId: string };
    }
  | {
      sessionId: string;
      actorPlayerId: string;
      expectedVersion: number;
      actionType: "RESPOND_TRANSFER";
      payload: { requestId: string; status: Exclude<RequestStatus, "pending"> };
    }
  | {
      sessionId: string;
      actorPlayerId: string;
      expectedVersion: number;
      actionType: "START_TIE";
      payload: { reason: "spec_equal" };
    }
  | {
      sessionId: string;
      actorPlayerId: string;
      expectedVersion: number;
      actionType: "LOSE_TIE";
      payload: { winnerPlayerId: string };
    }
  | {
      sessionId: string;
      actorPlayerId: string;
      expectedVersion: number;
      actionType: "RESPOND_TIE";
      payload: { requestId: string; status: Exclude<RequestStatus, "pending"> };
    };

type SessionAccessRequest =
  | {
      kind: "CREATE_SESSION";
      playerName: string;
    }
  | {
      kind: "JOIN_SESSION";
      playerName: string;
      sessionCode: string;
    };

type PostPayload = GameActionRequest | SessionAccessRequest;

type GameEvent =
  | {
      type: "spec_selected";
      payload: { playerId: string; specKey: string };
      at: string;
    }
  | {
      type: "transfer_requested";
      payload: TransferRequest;
      at: string;
    }
  | {
      type: "transfer_responded";
      payload: {
        requestId: string;
        status: Exclude<RequestStatus, "pending">;
        fromPlayerId: string;
        toPlayerId: string;
      };
      at: string;
    }
  | {
      type: "tie_started";
      payload: { rounds: number; potSize: number };
      at: string;
    }
  | {
      type: "tie_lost_requested";
      payload: LoseTieRequest;
      at: string;
    }
  | {
      type: "tie_lost_responded";
      payload: { requestId: string; status: Exclude<RequestStatus, "pending"> };
      at: string;
    }
  | {
      type: "state_updated";
      payload: { state: SessionState };
      at: string;
    };

interface ActionResponse {
  state: SessionState;
  events: GameEvent[];
  appliedVersion: number;
  latestEventId: number;
}

interface SessionBootstrapResponse {
  state: SessionState;
  latestEventId: number;
}

interface SessionAccessResponse {
  state: SessionState;
  latestEventId: number;
  playerId: string;
}

interface GameSessionRow {
  id: string;
  session_code: string;
  status: SessionStatus;
  host_player_id: string | null;
  deck_id: string | null;
  winner_player_id: string | null;
  state: SessionState;
  version: number;
}

interface GamePlayerRow {
  id: string;
  player_name: string;
  color: string;
  is_host: boolean;
  seat_index: number;
}

interface DeckCardRow {
  id: string;
  code: string;
  category: string;
  image_url: string;
  specs: SpecField[];
}

class GameActionError extends Error {}

const BUILTIN_DECK_ID = "pirate-ships-v1";
const PLAYER_COLORS = ["#01ADFF", "#C669FF"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });

const normalizeName = (value: string): string => value.trim().replace(/\s+/g, " ").slice(0, 24);

const nowIso = () => new Date().toISOString();

const makePlayerId = () => `p_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;

const makeSessionCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const random = crypto.getRandomValues(new Uint32Array(6));
  return Array.from(random)
    .map((entry) => chars[entry % chars.length])
    .join("");
};

const cloneState = (state: SessionState): SessionState => structuredClone(state);

const asSessionState = (row: GameSessionRow): SessionState => {
  const state = cloneState(row.state);
  state.sessionId = row.id;
  state.sessionCode = row.session_code;
  state.status = row.status ?? state.status;
  state.hostPlayerId = row.host_player_id ?? state.hostPlayerId;
  state.deckId = row.deck_id ?? state.deckId;
  state.winnerPlayerId = row.winner_player_id ?? state.winnerPlayerId ?? null;
  state.version = row.version;
  return state;
};

const sessionColumnsFromState = (state: SessionState) => ({
  state,
  version: state.version,
  status: state.status,
  host_player_id: state.hostPlayerId,
  deck_id: state.deckId,
  winner_player_id: state.winnerPlayerId,
  updated_at: state.updatedAt
});

const findPlayer = (state: SessionState, playerId: string): PlayerState => {
  const player = state.players.find((entry) => entry.id === playerId);
  if (!player) {
    throw new GameActionError("Player not found.");
  }
  return player;
};

const getOpponent = (state: SessionState, playerId: string): PlayerState => {
  const opponent = state.players.find((entry) => entry.id !== playerId);
  if (!opponent) {
    throw new GameActionError("Opponent not found.");
  }
  return opponent;
};

const getTopCard = (player: PlayerState): CardView | null => player.hand[0] ?? null;

const removeTopCard = (player: PlayerState): CardView => {
  const topCard = player.hand.shift();
  if (!topCard) {
    throw new GameActionError("Missing top card.");
  }
  return topCard;
};

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

const appendStateUpdate = (events: GameEvent[], state: SessionState, at: string) => {
  events.push({
    type: "state_updated",
    payload: { state: cloneState(state) },
    at
  });
};

const applyGameplayAction = (inputState: SessionState, request: GameActionRequest): ActionResponse => {
  if (request.actionType === "START_GAME") {
    throw new GameActionError("START_GAME requires server deck initialization.");
  }

  if (request.expectedVersion !== inputState.version) {
    throw new GameActionError("Stale action rejected.");
  }

  const state = cloneState(inputState);
  const at = nowIso();
  const events: GameEvent[] = [];

  if (state.status !== "running") {
    throw new GameActionError("Game is not running.");
  }

  if (request.actionType === "SELECT_SPEC") {
    const actor = findPlayer(state, request.actorPlayerId);
    const topCard = getTopCard(actor);
    if (!topCard) {
      throw new GameActionError("No top card to select from.");
    }
    const hasSpec = topCard.specs.some((spec) => spec.key === request.payload.specKey);
    if (!hasSpec) {
      throw new GameActionError("Spec key not present on top card.");
    }
    state.selectedSpecKey = request.payload.specKey;
    state.selectedByPlayerId = request.actorPlayerId;
    events.push({
      type: "spec_selected",
      payload: {
        playerId: request.actorPlayerId,
        specKey: request.payload.specKey
      },
      at
    });
  }

  if (request.actionType === "SEND_CARD") {
    if (state.pendingTransfer) {
      throw new GameActionError("Pending transfer already exists.");
    }
    const actor = findPlayer(state, request.actorPlayerId);
    const opponent = getOpponent(state, request.actorPlayerId);
    const topCard = getTopCard(actor);
    if (!topCard || topCard.id !== request.payload.cardId) {
      throw new GameActionError("Stale send request.");
    }
    const transfer: TransferRequest = {
      id: crypto.randomUUID(),
      fromPlayerId: actor.id,
      toPlayerId: opponent.id,
      cardId: topCard.id,
      status: "pending"
    };
    state.pendingTransfer = transfer;
    events.push({ type: "transfer_requested", payload: transfer, at });
  }

  if (request.actionType === "RESPOND_TRANSFER") {
    const transfer = state.pendingTransfer;
    if (!transfer) {
      throw new GameActionError("No pending transfer request.");
    }
    if (transfer.id !== request.payload.requestId) {
      throw new GameActionError("Transfer request mismatch.");
    }
    if (transfer.toPlayerId !== request.actorPlayerId) {
      throw new GameActionError("Only receiver can respond.");
    }
    if (request.payload.status === "accepted") {
      const sender = findPlayer(state, transfer.fromPlayerId);
      const receiver = findPlayer(state, transfer.toPlayerId);
      const senderTop = getTopCard(sender);
      const receiverTop = getTopCard(receiver);
      if (!senderTop || senderTop.id !== transfer.cardId) {
        throw new GameActionError("Sender top card changed.");
      }
      if (!receiverTop) {
        throw new GameActionError("Receiver top card missing.");
      }
      const movedReceiverTop = removeTopCard(receiver);
      const movedSenderTop = removeTopCard(sender);
      receiver.hand.push(movedReceiverTop, movedSenderTop);
    }
    state.pendingTransfer = null;
    events.push({
      type: "transfer_responded",
      payload: {
        requestId: transfer.id,
        status: request.payload.status,
        fromPlayerId: transfer.fromPlayerId,
        toPlayerId: transfer.toPlayerId
      },
      at
    });
  }

  if (request.actionType === "START_TIE") {
    if (state.pendingTransfer) {
      throw new GameActionError("Resolve transfer before tie.");
    }
    if (state.tieState.active) {
      throw new GameActionError("Tie already active.");
    }
    const [firstPlayer, secondPlayer] = state.players;
    if (!firstPlayer || !secondPlayer) {
      throw new GameActionError("Tie requires exactly two players.");
    }
    if (firstPlayer.hand.length === 0 || secondPlayer.hand.length === 0) {
      throw new GameActionError("Both players need a top card.");
    }
    const cardOne = removeTopCard(firstPlayer);
    const cardTwo = removeTopCard(secondPlayer);
    state.tieState.active = true;
    state.tieState.rounds += 1;
    state.tieState.potCards.push(cardOne, cardTwo);
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
  }

  if (request.actionType === "LOSE_TIE") {
    if (!state.tieState.active) {
      throw new GameActionError("Tie is not active.");
    }
    if (state.loseTieRequest) {
      throw new GameActionError("Pending lose-tie request exists.");
    }
    if (request.payload.winnerPlayerId === request.actorPlayerId) {
      throw new GameActionError("Winner cannot equal loser.");
    }
    findPlayer(state, request.actorPlayerId);
    findPlayer(state, request.payload.winnerPlayerId);
    const loseTieRequest: LoseTieRequest = {
      id: crypto.randomUUID(),
      loserPlayerId: request.actorPlayerId,
      winnerPlayerId: request.payload.winnerPlayerId,
      status: "pending"
    };
    state.loseTieRequest = loseTieRequest;
    state.tieState.pendingLoseTieRequestId = loseTieRequest.id;
    events.push({
      type: "tie_lost_requested",
      payload: loseTieRequest,
      at
    });
  }

  if (request.actionType === "RESPOND_TIE") {
    const loseTieRequest = state.loseTieRequest;
    if (!loseTieRequest) {
      throw new GameActionError("No pending lose-tie request.");
    }
    if (loseTieRequest.id !== request.payload.requestId) {
      throw new GameActionError("Lose-tie request mismatch.");
    }
    if (loseTieRequest.winnerPlayerId !== request.actorPlayerId) {
      throw new GameActionError("Only selected winner can respond.");
    }
    if (request.payload.status === "accepted") {
      const winner = findPlayer(state, loseTieRequest.winnerPlayerId);
      const loser = findPlayer(state, loseTieRequest.loserPlayerId);
      winner.hand.push(...state.tieState.potCards);
      const loserTop = getTopCard(loser);
      if (loserTop) {
        winner.hand.push(removeTopCard(loser));
      }
      state.tieState.potCards = [];
      state.tieState.rounds = 0;
      state.tieState.active = false;
      state.selectedSpecKey = null;
      state.selectedByPlayerId = null;
    }
    state.loseTieRequest = null;
    state.tieState.pendingLoseTieRequestId = null;
    events.push({
      type: "tie_lost_responded",
      payload: {
        requestId: request.payload.requestId,
        status: request.payload.status
      },
      at
    });
  }

  maybeFinishGame(state);
  state.version += 1;
  state.updatedAt = at;
  appendStateUpdate(events, state, at);

  return {
    state,
    events,
    appliedVersion: state.version,
    latestEventId: 0
  };
};

const fetchLatestEventId = async (
  client: ReturnType<typeof createClient>,
  sessionId: string
): Promise<number> => {
  const { data: latestRow, error } = await client
    .from("game_events")
    .select("id")
    .eq("session_id", sessionId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new GameActionError(error.message);
  }

  return latestRow?.id ?? 0;
};

const insertEvents = async (
  client: ReturnType<typeof createClient>,
  sessionId: string,
  events: GameEvent[]
) => {
  if (events.length === 0) {
    return;
  }
  const inserts = events.map((event) => ({
    session_id: sessionId,
    event_type: event.type,
    payload: event
  }));
  const { error } = await client.from("game_events").insert(inserts);
  if (error) {
    throw new GameActionError(error.message);
  }
};

const fetchSessionById = async (
  client: ReturnType<typeof createClient>,
  sessionId: string
): Promise<GameSessionRow> => {
  const { data, error } = await client
    .from("game_sessions")
    .select("id, session_code, status, host_player_id, deck_id, winner_player_id, state, version")
    .eq("id", sessionId)
    .single();

  if (error || !data) {
    throw new GameActionError("Session not found.");
  }
  return data as GameSessionRow;
};

const fetchSessionByCode = async (
  client: ReturnType<typeof createClient>,
  sessionCode: string
): Promise<GameSessionRow> => {
  const { data, error } = await client
    .from("game_sessions")
    .select("id, session_code, status, host_player_id, deck_id, winner_player_id, state, version")
    .eq("session_code", sessionCode)
    .single();

  if (error || !data) {
    throw new GameActionError("Session code is invalid.");
  }
  return data as GameSessionRow;
};

const fetchSessionPlayers = async (
  client: ReturnType<typeof createClient>,
  sessionId: string
): Promise<GamePlayerRow[]> => {
  const { data, error } = await client
    .from("game_players")
    .select("id, player_name, color, is_host, seat_index")
    .eq("session_id", sessionId)
    .order("seat_index", { ascending: true });

  if (error) {
    throw new GameActionError(error.message);
  }
  return (data ?? []) as GamePlayerRow[];
};

const fetchDeckCards = async (
  client: ReturnType<typeof createClient>,
  deckId: string
): Promise<CardView[]> => {
  const { data, error } = await client
    .from("deck_cards")
    .select("id, code, category, image_url, specs")
    .eq("deck_id", deckId)
    .order("sort_order", { ascending: true });

  if (error) {
    throw new GameActionError(error.message);
  }
  const rows = (data ?? []) as DeckCardRow[];
  if (rows.length === 0) {
    throw new GameActionError("Deck has no cards.");
  }
  return rows.map((row) => ({
    id: row.id,
    code: row.code,
    category: row.category,
    imageUrl: row.image_url,
    specs: row.specs
  }));
};

const shuffle = <T>(values: T[]): T[] => {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const assertPlayerInSession = (state: SessionState, playerId: string) => {
  const exists = state.players.some((player) => player.id === playerId);
  if (!exists) {
    throw new GameActionError("Player is not part of this session.");
  }
};

const isSessionAccessRequest = (payload: PostPayload): payload is SessionAccessRequest =>
  typeof payload === "object" && payload !== null && "kind" in payload;

const buildLobbyState = (
  sessionId: string,
  sessionCode: string,
  hostPlayer: { id: string; name: string; color: string }
): SessionState => {
  const at = nowIso();
  return {
    sessionId,
    sessionCode,
    status: "lobby",
    hostPlayerId: hostPlayer.id,
    deckId: BUILTIN_DECK_ID,
    winnerPlayerId: null,
    players: [
      {
        id: hostPlayer.id,
        name: hostPlayer.name,
        color: hostPlayer.color,
        hand: []
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
    updatedAt: at
  };
};

const ensureBuiltinDeckExists = async (client: ReturnType<typeof createClient>) => {
  const { data, error } = await client
    .from("decks")
    .select("id")
    .eq("id", BUILTIN_DECK_ID)
    .maybeSingle();
  if (error) {
    throw new GameActionError(error.message);
  }
  if (!data) {
    throw new GameActionError("Built-in deck is missing.");
  }
};

const createSessionAccess = async (
  client: ReturnType<typeof createClient>,
  payload: Extract<SessionAccessRequest, { kind: "CREATE_SESSION" }>
): Promise<SessionAccessResponse> => {
  const playerName = normalizeName(payload.playerName);
  if (!playerName) {
    throw new GameActionError("Player name is required.");
  }

  await ensureBuiltinDeckExists(client);

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const sessionId = crypto.randomUUID();
    const sessionCode = makeSessionCode();
    const playerId = makePlayerId();
    const hostColor = PLAYER_COLORS[0];
    const state = buildLobbyState(sessionId, sessionCode, {
      id: playerId,
      name: playerName,
      color: hostColor
    });

    const { error: insertSessionError } = await client.from("game_sessions").insert({
      id: sessionId,
      session_code: sessionCode,
      status: state.status,
      host_player_id: state.hostPlayerId,
      deck_id: state.deckId,
      winner_player_id: state.winnerPlayerId,
      state,
      version: state.version,
      updated_at: state.updatedAt
    });

    if (insertSessionError) {
      if (insertSessionError.code === "23505") {
        continue;
      }
      throw new GameActionError(insertSessionError.message);
    }

    const { error: insertPlayerError } = await client.from("game_players").insert({
      id: playerId,
      session_id: sessionId,
      player_name: playerName,
      color: hostColor,
      is_host: true,
      seat_index: 1
    });

    if (insertPlayerError) {
      await client.from("game_sessions").delete().eq("id", sessionId);
      throw new GameActionError(insertPlayerError.message);
    }

    const at = nowIso();
    await insertEvents(client, sessionId, [
      {
        type: "state_updated",
        payload: {
          state
        },
        at
      }
    ]);

    const latestEventId = await fetchLatestEventId(client, sessionId);
    return {
      state,
      latestEventId,
      playerId
    };
  }

  throw new GameActionError("Could not allocate a unique session code. Please retry.");
};

const joinSessionAccess = async (
  client: ReturnType<typeof createClient>,
  payload: Extract<SessionAccessRequest, { kind: "JOIN_SESSION" }>
): Promise<SessionAccessResponse> => {
  const playerName = normalizeName(payload.playerName);
  const sessionCode = payload.sessionCode.trim().toUpperCase();
  if (!playerName) {
    throw new GameActionError("Player name is required.");
  }
  if (!sessionCode) {
    throw new GameActionError("Invite code is required.");
  }

  const row = await fetchSessionByCode(client, sessionCode);
  const state = asSessionState(row);

  if (state.status !== "lobby") {
    throw new GameActionError("Session is no longer joinable.");
  }

  const players = await fetchSessionPlayers(client, state.sessionId);
  const existingPlayer = players.find(
    (player) => player.player_name.toLowerCase() === playerName.toLowerCase()
  );

  if (existingPlayer) {
    const latestEventId = await fetchLatestEventId(client, state.sessionId);
    return {
      state,
      latestEventId,
      playerId: existingPlayer.id
    };
  }

  if (players.length >= 2 || state.players.length >= 2) {
    throw new GameActionError("Session is full.");
  }

  const playerId = makePlayerId();
  const seatIndex = 2;
  const playerColor = PLAYER_COLORS[1];

  const { error: insertPlayerError } = await client.from("game_players").insert({
    id: playerId,
    session_id: state.sessionId,
    player_name: playerName,
    color: playerColor,
    is_host: false,
    seat_index: seatIndex
  });

  if (insertPlayerError) {
    if (insertPlayerError.code === "23505") {
      throw new GameActionError("Session was just filled. Please refresh.");
    }
    throw new GameActionError(insertPlayerError.message);
  }

  const nextState = cloneState(state);
  nextState.players.push({
    id: playerId,
    name: playerName,
    color: playerColor,
    hand: []
  });
  nextState.version += 1;
  nextState.updatedAt = nowIso();

  const { data: updated, error: updateError } = await client
    .from("game_sessions")
    .update(sessionColumnsFromState(nextState))
    .eq("id", state.sessionId)
    .eq("version", state.version)
    .select("id")
    .maybeSingle();

  if (updateError) {
    await client.from("game_players").delete().eq("id", playerId);
    throw new GameActionError(updateError.message);
  }

  if (!updated) {
    await client.from("game_players").delete().eq("id", playerId);
    throw new GameActionError("Version conflict. Please retry joining.");
  }

  await insertEvents(client, state.sessionId, [
    {
      type: "state_updated",
      payload: { state: nextState },
      at: nextState.updatedAt
    }
  ]);

  const latestEventId = await fetchLatestEventId(client, state.sessionId);
  return {
    state: nextState,
    latestEventId,
    playerId
  };
};

const startGameAction = async (
  client: ReturnType<typeof createClient>,
  inputState: SessionState,
  request: Extract<GameActionRequest, { actionType: "START_GAME" }>
): Promise<ActionResponse> => {
  if (request.expectedVersion !== inputState.version) {
    throw new GameActionError("Stale action rejected.");
  }
  if (inputState.status !== "lobby") {
    throw new GameActionError("Game already started.");
  }
  if (inputState.hostPlayerId !== request.actorPlayerId) {
    throw new GameActionError("Only the host can start the game.");
  }
  if (inputState.players.length !== 2) {
    throw new GameActionError("Exactly two players are required.");
  }

  const playerRows = await fetchSessionPlayers(client, inputState.sessionId);
  if (playerRows.length !== 2) {
    throw new GameActionError("Lobby must contain exactly two connected players.");
  }

  const cards = await fetchDeckCards(client, inputState.deckId);
  const shuffledCards = shuffle(cards);

  const players: PlayerState[] = playerRows.map((row) => ({
    id: row.id,
    name: row.player_name,
    color: row.color,
    hand: []
  }));

  for (let index = 0; index < shuffledCards.length; index += 1) {
    const playerIndex = index % players.length;
    players[playerIndex].hand.push(shuffledCards[index]);
  }

  const nextState = cloneState(inputState);
  nextState.status = "running";
  nextState.players = players;
  nextState.selectedSpecKey = null;
  nextState.selectedByPlayerId = null;
  nextState.pendingTransfer = null;
  nextState.loseTieRequest = null;
  nextState.tieState = {
    active: false,
    rounds: 0,
    potCards: [],
    pendingLoseTieRequestId: null
  };
  nextState.winnerPlayerId = null;
  nextState.version += 1;
  nextState.updatedAt = nowIso();

  const events: GameEvent[] = [];
  appendStateUpdate(events, nextState, nextState.updatedAt);

  return {
    state: nextState,
    events,
    appliedVersion: nextState.version,
    latestEventId: 0
  };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !serviceRoleKey) {
      return json(500, { error: "Missing Supabase environment variables." });
    }

    const client = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false }
    });

    if (request.method === "GET") {
      const url = new URL(request.url);
      const sessionId = url.searchParams.get("session")?.trim() ?? "";
      if (!sessionId) {
        return json(400, { error: "Missing session query parameter." });
      }

      const row = await fetchSessionById(client, sessionId);
      const state = asSessionState(row);
      const latestEventId = await fetchLatestEventId(client, sessionId);

      const response: SessionBootstrapResponse = {
        state,
        latestEventId
      };

      return json(200, response);
    }

    if (request.method !== "POST") {
      return json(405, { error: "Method not allowed." });
    }

    const payload = (await request.json()) as PostPayload;

    if (isSessionAccessRequest(payload)) {
      if (payload.kind === "CREATE_SESSION") {
        const response = await createSessionAccess(client, payload);
        return json(200, response);
      }
      if (payload.kind === "JOIN_SESSION") {
        const response = await joinSessionAccess(client, payload);
        return json(200, response);
      }
      return json(400, { error: "Unknown session access request kind." });
    }

    const action = payload as GameActionRequest;
    const row = await fetchSessionById(client, action.sessionId);
    const currentState = asSessionState(row);
    assertPlayerInSession(currentState, action.actorPlayerId);

    const response =
      action.actionType === "START_GAME"
        ? await startGameAction(client, currentState, action)
        : applyGameplayAction(currentState, action);

    const { data: updatedRow, error: updateError } = await client
      .from("game_sessions")
      .update(sessionColumnsFromState(response.state))
      .eq("id", action.sessionId)
      .eq("version", action.expectedVersion)
      .select("id")
      .maybeSingle();

    if (updateError) {
      return json(500, { error: updateError.message });
    }

    if (!updatedRow) {
      return json(409, { error: "Version conflict. Please retry with latest state." });
    }

    await insertEvents(client, action.sessionId, response.events);
    const latestEventId = await fetchLatestEventId(client, action.sessionId);

    return json(200, {
      ...response,
      appliedVersion: response.state.version,
      latestEventId
    } as ActionResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return json(400, { error: message });
  }
});
