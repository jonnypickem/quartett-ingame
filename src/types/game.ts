export type GameActionType =
  | "SELECT_SPEC"
  | "SEND_CARD"
  | "RESPOND_TRANSFER"
  | "START_TIE"
  | "LOSE_TIE"
  | "RESPOND_TIE";

export type RequestStatus = "pending" | "accepted" | "declined";

export interface SpecField {
  key: string;
  label: string;
  value: number;
}

export interface CardView {
  id: string;
  code: string;
  category: string;
  imageUrl: string;
  specs: SpecField[];
}

export interface PlayerState {
  id: string;
  name: string;
  color: string;
  hand: CardView[];
}

export interface TransferRequest {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  cardId: string;
  status: RequestStatus;
}

export interface LoseTieRequest {
  id: string;
  loserPlayerId: string;
  winnerPlayerId: string;
  status: RequestStatus;
}

export interface TieState {
  active: boolean;
  rounds: number;
  potCards: CardView[];
  pendingLoseTieRequestId: string | null;
}

export interface SessionState {
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

export interface SessionViewState {
  yourCount: number;
  opponentCount: number;
  yourTopCard: CardView | null;
  opponentTopCard: CardView | null;
  selectedSpecKey: string | null;
  selectedByPlayerId: string | null;
  tieState: TieState;
  pendingTransfer: TransferRequest | null;
  loseTieRequest: LoseTieRequest | null;
}

export interface ActionBase {
  sessionId: string;
  actorPlayerId: string;
  expectedVersion: number;
}

export type GameActionRequest =
  | (ActionBase & {
      actionType: "SELECT_SPEC";
      payload: {
        specKey: string;
      };
    })
  | (ActionBase & {
      actionType: "SEND_CARD";
      payload: {
        cardId: string;
      };
    })
  | (ActionBase & {
      actionType: "RESPOND_TRANSFER";
      payload: {
        requestId: string;
        status: Exclude<RequestStatus, "pending">;
      };
    })
  | (ActionBase & {
      actionType: "START_TIE";
      payload: {
        reason: "spec_equal";
      };
    })
  | (ActionBase & {
      actionType: "LOSE_TIE";
      payload: {
        winnerPlayerId: string;
      };
    })
  | (ActionBase & {
      actionType: "RESPOND_TIE";
      payload: {
        requestId: string;
        status: Exclude<RequestStatus, "pending">;
      };
    });

export type GameEvent =
  | {
      type: "spec_selected";
      payload: {
        playerId: string;
        specKey: string;
      };
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
      payload: {
        rounds: number;
        potSize: number;
      };
      at: string;
    }
  | {
      type: "tie_lost_requested";
      payload: LoseTieRequest;
      at: string;
    }
  | {
      type: "tie_lost_responded";
      payload: {
        requestId: string;
        status: Exclude<RequestStatus, "pending">;
      };
      at: string;
    }
  | {
      type: "state_updated";
      payload: {
        state: SessionState;
      };
      at: string;
    };

export interface ActionResponse {
  state: SessionState;
  events: GameEvent[];
}

export interface GameUiState {
  session: SessionState;
  eventQueue: GameEvent[];
  busy: boolean;
  lastError: string | null;
}
