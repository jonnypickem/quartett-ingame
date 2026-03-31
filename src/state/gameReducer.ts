import type { GameEvent, GameUiState, SessionState } from "../types/game";

export type UiAction =
  | { type: "ENQUEUE_EVENTS"; events: GameEvent[] }
  | { type: "PROCESS_NEXT_EVENT" }
  | { type: "SET_BUSY"; value: boolean }
  | { type: "SET_ERROR"; message: string | null }
  | { type: "SET_SESSION"; session: SessionState };

export const createInitialUiState = (session: SessionState): GameUiState => ({
  session,
  eventQueue: [],
  busy: false,
  lastError: null
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

      return {
        ...state,
        session: applySingleEvent(state.session, next),
        eventQueue: rest
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
    case "SET_SESSION":
      return {
        ...state,
        session: action.session
      };
    default:
      return state;
  }
};
