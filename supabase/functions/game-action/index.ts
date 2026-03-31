import { createClient } from "https://esm.sh/@supabase/supabase-js@2.53.0";

type RequestStatus = "pending" | "accepted" | "declined";

type GameActionType =
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
}

class GameActionError extends Error {}

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

const appendStateUpdate = (events: GameEvent[], state: SessionState, at: string) => {
  events.push({
    type: "state_updated",
    payload: { state: structuredClone(state) },
    at
  });
};

const applyAction = (inputState: SessionState, request: GameActionRequest): ActionResponse => {
  if (request.expectedVersion !== inputState.version) {
    throw new GameActionError("Stale action rejected.");
  }

  const state = structuredClone(inputState);
  const at = new Date().toISOString();
  const events: GameEvent[] = [];

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
      if (!senderTop || senderTop.id !== transfer.cardId) {
        throw new GameActionError("Sender top card changed.");
      }
      receiver.hand.push(removeTopCard(sender));
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

  state.version += 1;
  state.updatedAt = at;
  appendStateUpdate(events, state, at);

  return { state, events };
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json(405, { error: "Method not allowed." });
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

    const payload = (await request.json()) as GameActionRequest;
    const { data: row, error: fetchError } = await client
      .from("game_sessions")
      .select("id, state, version")
      .eq("id", payload.sessionId)
      .single();

    if (fetchError || !row) {
      return json(404, { error: "Session not found." });
    }

    const currentState = row.state as SessionState;
    currentState.version = row.version;

    const response = applyAction(currentState, payload);

    const { data: updatedRow, error: updateError } = await client
      .from("game_sessions")
      .update({
        state: response.state,
        version: response.state.version,
        updated_at: response.state.updatedAt
      })
      .eq("id", payload.sessionId)
      .eq("version", payload.expectedVersion)
      .select("id")
      .maybeSingle();

    if (updateError) {
      return json(500, { error: updateError.message });
    }

    if (!updatedRow) {
      return json(409, { error: "Version conflict. Please retry with latest state." });
    }

    if (response.events.length > 0) {
      const inserts = response.events.map((event) => ({
        session_id: payload.sessionId,
        event_type: event.type,
        payload: event
      }));
      const { error: eventInsertError } = await client.from("game_events").insert(inserts);
      if (eventInsertError) {
        return json(500, { error: eventInsertError.message });
      }
    }

    return json(200, response);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected error.";
    return json(400, { error: message });
  }
});
