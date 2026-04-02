import { useCallback, useEffect, useMemo, useReducer, useRef } from "react";
import {
  fetchSessionBootstrap,
  resolveRuntimeMode,
  submitAction,
  subscribeToSessionEvents
} from "../lib/gameApi";
import { validatePlayerInSession } from "../lib/routeContext";
import { createSessionView } from "../lib/gameEngine";
import { createMockSessionState } from "../state/mockState";
import { createInitialUiState, gameReducer } from "../state/gameReducer";
import type { GameActionRequest, RequestStatus } from "../types/game";

export const useGameSession = (sessionId: string, currentPlayerId: string) => {
  const runtimeMode = resolveRuntimeMode();

  const [uiState, dispatch] = useReducer(
    gameReducer,
    createMockSessionState(sessionId),
    (initialSession) => createInitialUiState(initialSession, runtimeMode)
  );
  const sessionRef = useRef(uiState.session);
  const lastSeenEventIdRef = useRef(uiState.lastSeenEventId);

  useEffect(() => {
    sessionRef.current = uiState.session;
  }, [uiState.session]);

  useEffect(() => {
    lastSeenEventIdRef.current = uiState.lastSeenEventId;
  }, [uiState.lastSeenEventId]);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      dispatch({ type: "SET_BUSY", value: true });
      dispatch({
        type: "SET_CONNECTION_STATUS",
        status: runtimeMode === "realtime" ? "bootstrapping" : "degraded"
      });
      dispatch({ type: "SET_CONTEXT_ERROR", error: null });
      dispatch({ type: "SET_ERROR", message: null });

      try {
        const response = await fetchSessionBootstrap(sessionId, currentPlayerId);
        if (cancelled) {
          return;
        }

        const playerValidation = validatePlayerInSession(response.state, currentPlayerId);
        if (!playerValidation.ok) {
          dispatch({
            type: "SET_CONTEXT_ERROR",
            error: {
              code: playerValidation.code,
              message: playerValidation.message
            }
          });
          dispatch({ type: "SET_CONNECTION_STATUS", status: "error" });
          return;
        }

        dispatch({
          type: "SET_BOOTSTRAP",
          session: response.state,
          lastSeenEventId: response.latestEventId,
          runtimeMode,
          connectionStatus: runtimeMode === "realtime" ? "connected" : "degraded"
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to bootstrap session.";
        dispatch({ type: "SET_ERROR", message });
        dispatch({ type: "SET_CONNECTION_STATUS", status: "error" });
      } finally {
        dispatch({ type: "SET_BUSY", value: false });
      }
    };

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [currentPlayerId, runtimeMode, sessionId]);

  useEffect(() => {
    if (runtimeMode !== "realtime" || uiState.contextError) {
      return;
    }

    const unsubscribe = subscribeToSessionEvents(sessionId, (row) => {
      if (row.id <= lastSeenEventIdRef.current) {
        return;
      }

      dispatch({ type: "ENQUEUE_EVENTS", events: [row] });
    });

    return unsubscribe;
  }, [runtimeMode, sessionId, uiState.contextError]);

  useEffect(() => {
    if (runtimeMode !== "realtime" || uiState.contextError) {
      return;
    }

    const heartbeat = window.setInterval(() => {
      void fetchSessionBootstrap(sessionId, currentPlayerId)
        .then((response) => {
          if (response.state.version > sessionRef.current.version) {
            dispatch({
              type: "SET_BOOTSTRAP",
              session: response.state,
              lastSeenEventId: response.latestEventId,
              runtimeMode,
              connectionStatus: "connected"
            });
          }
        })
        .catch(() => {
          // Realtime stream remains source of truth; ignore transient heartbeat failures.
        });
    }, 15000);

    return () => {
      window.clearInterval(heartbeat);
    };
  }, [currentPlayerId, runtimeMode, sessionId, uiState.contextError]);

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
    async (request: Omit<GameActionRequest, "sessionId" | "expectedVersion">): Promise<boolean> => {
      if (uiState.contextError) {
        return false;
      }

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

        dispatch({
          type: "APPLY_ACTION_RESPONSE",
          session: response.state,
          lastSeenEventId: response.latestEventId
        });
        return true;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown action error.";
        dispatch({ type: "SET_ERROR", message });
        return false;
      } finally {
        dispatch({ type: "SET_BUSY", value: false });
      }
    },
    [uiState.contextError]
  );

  const yourPlayer = useMemo(
    () => uiState.session.players.find((player) => player.id === currentPlayerId) ?? null,
    [currentPlayerId, uiState.session.players]
  );

  const opponent = useMemo(
    () => uiState.session.players.find((player) => player.id !== currentPlayerId) ?? null,
    [currentPlayerId, uiState.session.players]
  );

  const view = useMemo(() => {
    const hasCurrentPlayer = uiState.session.players.some((player) => player.id === currentPlayerId);
    const fallbackPlayerId = uiState.session.players[0]?.id;
    const playerIdForView = hasCurrentPlayer ? currentPlayerId : fallbackPlayerId;

    if (!playerIdForView) {
      return {
        yourCount: 0,
        opponentCount: 0,
        yourTopCard: null,
        opponentTopCard: null,
        selectedSpecKey: uiState.session.selectedSpecKey,
        selectedByPlayerId: uiState.session.selectedByPlayerId,
        tieState: uiState.session.tieState,
        pendingTransfer: uiState.session.pendingTransfer,
        loseTieRequest: uiState.session.loseTieRequest
      };
    }

    const currentPlayer = uiState.session.players.find((player) => player.id === playerIdForView) ?? null;
    const opponentPlayer =
      uiState.session.players.find((player) => player.id !== playerIdForView) ?? null;

    if (!currentPlayer || !opponentPlayer) {
      return {
        yourCount: currentPlayer?.hand.length ?? 0,
        opponentCount: opponentPlayer?.hand.length ?? 0,
        yourTopCard: currentPlayer?.hand[0] ?? null,
        opponentTopCard: opponentPlayer?.hand[0] ?? null,
        selectedSpecKey: uiState.session.selectedSpecKey,
        selectedByPlayerId: uiState.session.selectedByPlayerId,
        tieState: uiState.session.tieState,
        pendingTransfer: uiState.session.pendingTransfer,
        loseTieRequest: uiState.session.loseTieRequest
      };
    }

    return createSessionView(uiState.session, playerIdForView);
  }, [currentPlayerId, uiState.session]);

  const selectSpec = useCallback(
    async (specKey: string) => {
      return await callAction({
        actionType: "SELECT_SPEC",
        actorPlayerId: currentPlayerId,
        payload: { specKey }
      });
    },
    [callAction, currentPlayerId]
  );

  const sendTopCard = useCallback(async () => {
    if (!view.yourTopCard) {
      return false;
    }

    return await callAction({
      actionType: "SEND_CARD",
      actorPlayerId: currentPlayerId,
      payload: {
        cardId: view.yourTopCard.id
      }
    });
  }, [callAction, currentPlayerId, view.yourTopCard]);

  const startGame = useCallback(async () => {
    return await callAction({
      actionType: "START_GAME",
      actorPlayerId: currentPlayerId,
      payload: {}
    });
  }, [callAction, currentPlayerId]);

  const selectDeck = useCallback(
    async (deckId: string) => {
      return await callAction({
        actionType: "SELECT_DECK",
        actorPlayerId: currentPlayerId,
        payload: { deckId }
      });
    },
    [callAction, currentPlayerId]
  );

  const respondTransfer = useCallback(
    async (status: Exclude<RequestStatus, "pending">) => {
      const pending = sessionRef.current.pendingTransfer;
      if (!pending) {
        return false;
      }

      return await callAction({
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
    return await callAction({
      actionType: "START_TIE",
      actorPlayerId: currentPlayerId,
      payload: {
        reason: "spec_equal"
      }
    });
  }, [callAction, currentPlayerId]);

  const loseTie = useCallback(async () => {
    if (!opponent) {
      return false;
    }

    return await callAction({
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
        return false;
      }

      return await callAction({
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
    runtimeMode,
    view,
    yourPlayer,
    opponent,
    selectSpec,
    sendTopCard,
    selectDeck,
    startGame,
    respondTransfer,
    startTie,
    loseTie,
    respondTie,
    connectionStatus: uiState.connectionStatus,
    contextError: uiState.contextError,
    clearError: () => dispatch({ type: "SET_ERROR", message: null })
  };
};
