import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyGameAction } from "../lib/gameEngine";
import { createMockSessionState } from "../state/mockState";
import type {
  ActionResponse,
  GameActionRequest,
  RealtimeEventRow,
  SessionBootstrapResponse,
  SessionState
} from "../types/game";

let serverState: SessionState = createMockSessionState("session-rt");
let latestEventId = 0;
const listeners = new Set<(row: RealtimeEventRow) => void>();

const emitRow = (row: RealtimeEventRow) => {
  listeners.forEach((listener) => listener(row));
};

vi.mock("../lib/gameApi", () => {
  return {
    resolveRuntimeMode: () => "realtime",
    fetchSessionBootstrap: async (_sessionId: string): Promise<SessionBootstrapResponse> => {
      return {
        state: structuredClone(serverState),
        latestEventId
      };
    },
    submitAction: async (request: GameActionRequest): Promise<ActionResponse> => {
      const response = applyGameAction(serverState, request);
      serverState = response.state;
      latestEventId += 1;

      const row: RealtimeEventRow = {
        id: latestEventId,
        payload: {
          type: "state_updated",
          payload: {
            state: structuredClone(serverState)
          },
          at: new Date().toISOString()
        }
      };

      window.setTimeout(() => emitRow(row), 0);

      return {
        ...response,
        appliedVersion: serverState.version,
        latestEventId
      };
    },
    subscribeToSessionEvents: (_sessionId: string, onRow: (row: RealtimeEventRow) => void) => {
      listeners.add(onRow);
      return () => {
        listeners.delete(onRow);
      };
    }
  };
});

import { useGameSession } from "./useGameSession";

describe("useGameSession realtime integration", () => {
  beforeEach(() => {
    serverState = createMockSessionState("session-rt");
    latestEventId = 0;
    listeners.clear();
  });

  it("keeps two player clients consistent through shared realtime events", async () => {
    const a = renderHook(() => useGameSession("session-rt", "p1"));
    const b = renderHook(() => useGameSession("session-rt", "p2"));

    await waitFor(() => {
      expect(a.result.current.connectionStatus).toBe("connected");
      expect(b.result.current.connectionStatus).toBe("connected");
    });
    const selectedSpecKey = a.result.current.view.yourTopCard?.specs[0]?.key;
    expect(selectedSpecKey).toBeTruthy();

    await act(async () => {
      await a.result.current.selectSpec(selectedSpecKey!);
    });

    await waitFor(() => {
      expect(a.result.current.view.selectedSpecKey).toBe(selectedSpecKey);
      expect(b.result.current.view.selectedSpecKey).toBe(selectedSpecKey);
    });

    await act(async () => {
      await a.result.current.sendTopCard();
    });

    await waitFor(() => {
      expect(b.result.current.view.pendingTransfer?.toPlayerId).toBe("p2");
    });

    await act(async () => {
      await b.result.current.respondTransfer("accepted");
    });

    await waitFor(() => {
      expect(a.result.current.view.yourCount).toBe(15);
      expect(b.result.current.view.opponentCount).toBe(15);
    });
  });

  it("resumes on reconnect and ignores already-seen event rows", async () => {
    const a = renderHook(() => useGameSession("session-rt", "p1"));
    const b = renderHook(() => useGameSession("session-rt", "p2"));

    await waitFor(() => {
      expect(a.result.current.connectionStatus).toBe("connected");
      expect(b.result.current.connectionStatus).toBe("connected");
    });
    const selectedSpecKey = a.result.current.view.yourTopCard?.specs[0]?.key;
    expect(selectedSpecKey).toBeTruthy();

    await act(async () => {
      await a.result.current.selectSpec(selectedSpecKey!);
    });

    await waitFor(() => {
      expect(b.result.current.view.selectedSpecKey).toBe(selectedSpecKey);
    });

    b.unmount();

    await act(async () => {
      await a.result.current.sendTopCard();
    });

    const reconnect = renderHook(() => useGameSession("session-rt", "p2"));

    await waitFor(() => {
      expect(reconnect.result.current.connectionStatus).toBe("connected");
      expect(reconnect.result.current.view.pendingTransfer?.toPlayerId).toBe("p2");
    });

    const versionBeforeDuplicate = reconnect.result.current.state.session.version;
    const duplicateRowId = reconnect.result.current.state.lastSeenEventId;

    act(() => {
      emitRow({
        id: duplicateRowId,
        payload: {
          type: "state_updated",
          payload: {
            state: {
              ...serverState,
              version: serverState.version - 1,
              selectedSpecKey: "armor"
            }
          },
          at: new Date().toISOString()
        }
      });
    });

    await waitFor(() => {
      expect(reconnect.result.current.state.session.version).toBe(versionBeforeDuplicate);
      expect(reconnect.result.current.state.session.selectedSpecKey).not.toBe("armor");
    });
  });

  it("renders safely for lobby bootstrap with only one player", async () => {
    const lobbyState = createMockSessionState("session-rt");
    lobbyState.status = "lobby";
    lobbyState.players = [
      {
        ...lobbyState.players[0],
        hand: []
      }
    ];
    lobbyState.pendingTransfer = null;
    lobbyState.loseTieRequest = null;
    lobbyState.tieState = {
      active: false,
      rounds: 0,
      potCards: [],
      pendingLoseTieRequestId: null
    };
    lobbyState.selectedSpecKey = null;
    lobbyState.selectedByPlayerId = null;
    serverState = lobbyState;

    const hook = renderHook(() => useGameSession("session-rt", lobbyState.players[0].id));

    await waitFor(() => {
      expect(hook.result.current.connectionStatus).toBe("connected");
    });

    expect(hook.result.current.opponent).toBeNull();
    expect(hook.result.current.view.yourCount).toBe(0);
    expect(hook.result.current.view.opponentCount).toBe(0);
  });
});
