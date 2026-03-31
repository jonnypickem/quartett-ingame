import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import { submitAction, subscribeToSessionEvents } from "../lib/gameApi";
import { createSessionView } from "../lib/gameEngine";
import { createInitialUiState, gameReducer } from "../state/gameReducer";
import { initialMockState } from "../state/mockState";
import type { GameActionRequest, RequestStatus } from "../types/game";

export const useGameSession = (currentPlayerId: string) => {
  const [uiState, dispatch] = useReducer(gameReducer, initialMockState, createInitialUiState);
  const sessionRef = useRef(uiState.session);

  useEffect(() => {
    sessionRef.current = uiState.session;
  }, [uiState.session]);

  useEffect(() => {
    const unsubscribe = subscribeToSessionEvents(uiState.session.sessionId, (event) => {
      dispatch({ type: "ENQUEUE_EVENTS", events: [event] });
    });

    return unsubscribe;
  }, [uiState.session.sessionId]);

  useEffect(() => {
    if (uiState.eventQueue.length === 0) {
      return;
    }

    const handle = window.setTimeout(() => {
      dispatch({ type: "PROCESS_NEXT_EVENT" });
    }, 0);

    return () => {
      window.clearTimeout(handle);
    };
  }, [uiState.eventQueue]);

  const callAction = useCallback(
    async (request: Omit<GameActionRequest, "sessionId" | "expectedVersion">) => {
      dispatch({ type: "SET_BUSY", value: true });
      dispatch({ type: "SET_ERROR", message: null });

      try {
        const session = sessionRef.current;
        const response = await submitAction(
          {
            ...request,
            sessionId: session.sessionId,
            expectedVersion: session.version
          } as GameActionRequest,
          session
        );

        dispatch({ type: "ENQUEUE_EVENTS", events: response.events });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown action error.";
        dispatch({ type: "SET_ERROR", message });
      } finally {
        dispatch({ type: "SET_BUSY", value: false });
      }
    },
    []
  );

  const yourPlayer = useMemo(
    () => uiState.session.players.find((player) => player.id === currentPlayerId) ?? null,
    [currentPlayerId, uiState.session.players]
  );

  const opponent = useMemo(
    () => uiState.session.players.find((player) => player.id !== currentPlayerId) ?? null,
    [currentPlayerId, uiState.session.players]
  );

  const view = useMemo(() => createSessionView(uiState.session, currentPlayerId), [currentPlayerId, uiState.session]);

  const selectSpec = useCallback(
    async (specKey: string) => {
      await callAction({
        actionType: "SELECT_SPEC",
        actorPlayerId: currentPlayerId,
        payload: { specKey }
      });
    },
    [callAction, currentPlayerId]
  );

  const sendTopCard = useCallback(async () => {
    if (!view.yourTopCard) {
      return;
    }

    await callAction({
      actionType: "SEND_CARD",
      actorPlayerId: currentPlayerId,
      payload: {
        cardId: view.yourTopCard.id
      }
    });
  }, [callAction, currentPlayerId, view.yourTopCard]);

  const respondTransfer = useCallback(
    async (status: Exclude<RequestStatus, "pending">) => {
      const pending = sessionRef.current.pendingTransfer;
      if (!pending) {
        return;
      }

      await callAction({
        actionType: "RESPOND_TRANSFER",
        actorPlayerId: currentPlayerId,
        payload: {
          requestId: pending.id,
          status
        }
      });
    },
    [callAction, currentPlayerId]
  );

  const startTie = useCallback(async () => {
    await callAction({
      actionType: "START_TIE",
      actorPlayerId: currentPlayerId,
      payload: {
        reason: "spec_equal"
      }
    });
  }, [callAction, currentPlayerId]);

  const loseTie = useCallback(async () => {
    if (!opponent) {
      return;
    }

    await callAction({
      actionType: "LOSE_TIE",
      actorPlayerId: currentPlayerId,
      payload: {
        winnerPlayerId: opponent.id
      }
    });
  }, [callAction, currentPlayerId, opponent]);

  const respondTie = useCallback(
    async (status: Exclude<RequestStatus, "pending">) => {
      const loseTieRequest = sessionRef.current.loseTieRequest;
      if (!loseTieRequest) {
        return;
      }

      await callAction({
        actionType: "RESPOND_TIE",
        actorPlayerId: currentPlayerId,
        payload: {
          requestId: loseTieRequest.id,
          status
        }
      });
    },
    [callAction, currentPlayerId]
  );

  return {
    state: uiState,
    view,
    yourPlayer,
    opponent,
    selectSpec,
    sendTopCard,
    respondTransfer,
    startTie,
    loseTie,
    respondTie,
    clearError: () => dispatch({ type: "SET_ERROR", message: null })
  };
};
