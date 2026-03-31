import type {
  ConnectionStatus,
  GameEvent,
  GameUiState,
  RealtimeEventRow,
  RuntimeMode,
  SessionContextError,
  SessionState
} from "../types/game";

export type UiAction =
  | { type: "ENQUEUE_EVENTS"; events: RealtimeEventRow[] }
  | { type: "PROCESS_NEXT_EVENT" }
  | { type: "SET_BUSY"; value: boolean }
  | { type: "SET_ERROR"; message: string | null }
  | {
      type: "SET_BOOTSTRAP";
      session: SessionState;
      lastSeenEventId: number;
      runtimeMode: RuntimeMode;
      connectionStatus: ConnectionStatus;
    }
  | {
      type: "APPLY_ACTION_RESPONSE";
      session: SessionState;
      lastSeenEventId: number;
    }
  | {
      type: "SET_CONNECTION_STATUS";
      status: ConnectionStatus;
    }
  | {
      type: "SET_CONTEXT_ERROR";
      error: SessionContextError | null;
    };

export const createInitialUiState = (
  session: SessionState,
  runtimeMode: RuntimeMode = "local-mock"
): GameUiState => ({
  session,
  eventQueue: [],
  busy: false,
  lastError: null,
  lastSeenEventId: 0,
  connectionStatus: runtimeMode === "realtime" ? "bootstrapping" : "degraded",
  runtimeMode,
  contextError: null
});

const applySingleEvent = (session: SessionState, event: GameEvent): SessionState => {
  switch (event.type) {
    case "spec_selected":
      return {
        ...session,
        selectedSpecKey: event.payload.specKey,
        selectedByPlayerId: event.payload.playerId
      };
    case "transfer_requested":
      return {
        ...session,
        pendingTransfer: event.payload
      };
    case "transfer_responded":
      return {
        ...session,
        pendingTransfer: null
      };
    case "tie_started":
      return {
        ...session,
        tieState: {
          ...session.tieState,
          active: true,
          rounds: event.payload.rounds
        }
      };
    case "tie_lost_requested":
      return {
        ...session,
        loseTieRequest: event.payload,
        tieState: {
          ...session.tieState,
          pendingLoseTieRequestId: event.payload.id
        }
      };
    case "tie_lost_responded":
      return {
        ...session,
        loseTieRequest: null,
        tieState: {
          ...session.tieState,
          pendingLoseTieRequestId: null
        }
      };
    case "state_updated":
      return event.payload.state;
    default:
      return session;
  }
};

export const gameReducer = (state: GameUiState, action: UiAction): GameUiState => {
  switch (action.type) {
    case "ENQUEUE_EVENTS":
      return {
        ...state,
        eventQueue: [...state.eventQueue, ...action.events]
      };
    case "PROCESS_NEXT_EVENT": {
      const [next, ...rest] = state.eventQueue;
      if (!next) {
        return state;
      }

      if (next.id <= state.lastSeenEventId) {
        return {
          ...state,
          eventQueue: rest
        };
      }

      const event = next.payload;
      const nextSession =
        event.type === "state_updated" && event.payload.state.version <= state.session.version
          ? state.session
          : applySingleEvent(state.session, event);

      return {
        ...state,
        session: nextSession,
        eventQueue: rest,
        lastSeenEventId: Math.max(state.lastSeenEventId, next.id)
      };
    }
    case "SET_BUSY":
      return {
        ...state,
        busy: action.value
      };
    case "SET_ERROR":
      return {
        ...state,
        lastError: action.message
      };
    case "SET_BOOTSTRAP":
      return {
        ...state,
        session: action.session,
        lastSeenEventId: action.lastSeenEventId,
        runtimeMode: action.runtimeMode,
        connectionStatus: action.connectionStatus,
        contextError: null
      };
    case "APPLY_ACTION_RESPONSE":
      return {
        ...state,
        session: action.session,
        lastSeenEventId: Math.max(state.lastSeenEventId, action.lastSeenEventId)
      };
    case "SET_CONNECTION_STATUS":
      return {
        ...state,
        connectionStatus: action.status
      };
    case "SET_CONTEXT_ERROR":
      return {
        ...state,
        contextError: action.error
      };
    default:
      return state;
  }
};
