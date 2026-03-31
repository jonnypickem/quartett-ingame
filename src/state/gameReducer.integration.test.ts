import { describe, expect, it } from "vitest";
import { createInitialUiState, gameReducer } from "./gameReducer";
import { cloneSessionState, initialMockState } from "./mockState";

describe("gameReducer event queue", () => {
  it("applies canonical state_updated events and advances cursor", () => {
    const session = cloneSessionState(initialMockState);
    const ui = createInitialUiState(session, "realtime");

    const withEvents = gameReducer(ui, {
      type: "ENQUEUE_EVENTS",
      events: [
        {
          id: 9,
          payload: {
            type: "state_updated",
            payload: {
              state: {
                ...session,
                selectedSpecKey: "armor",
                selectedByPlayerId: "p2",
                version: session.version + 1
              }
            },
            at: new Date().toISOString()
          }
        }
      ]
    });

    const processed = gameReducer(withEvents, { type: "PROCESS_NEXT_EVENT" });

    expect(processed.session.selectedSpecKey).toBe("armor");
    expect(processed.session.selectedByPlayerId).toBe("p2");
    expect(processed.lastSeenEventId).toBe(9);
    expect(processed.eventQueue.length).toBe(0);
  });

  it("skips duplicate rows when id already seen", () => {
    const session = cloneSessionState(initialMockState);
    const ui = createInitialUiState(session, "realtime");

    const bootstrapped = gameReducer(ui, {
      type: "SET_BOOTSTRAP",
      session,
      lastSeenEventId: 22,
      runtimeMode: "realtime",
      connectionStatus: "connected"
    });

    const withDuplicate = gameReducer(bootstrapped, {
      type: "ENQUEUE_EVENTS",
      events: [
        {
          id: 22,
          payload: {
            type: "state_updated",
            payload: {
              state: {
                ...session,
                selectedSpecKey: "speed",
                version: session.version + 1
              }
            },
            at: new Date().toISOString()
          }
        }
      ]
    });

    const processed = gameReducer(withDuplicate, { type: "PROCESS_NEXT_EVENT" });

    expect(processed.session.selectedSpecKey).toBeNull();
    expect(processed.lastSeenEventId).toBe(22);
    expect(processed.eventQueue.length).toBe(0);
  });

  it("ignores stale state_updated versions", () => {
    const session = cloneSessionState(initialMockState);
    const ui = createInitialUiState({ ...session, version: 8 }, "realtime");

    const withStale = gameReducer(ui, {
      type: "ENQUEUE_EVENTS",
      events: [
        {
          id: 30,
          payload: {
            type: "state_updated",
            payload: {
              state: {
                ...session,
                version: 7,
                selectedSpecKey: "luck"
              }
            },
            at: new Date().toISOString()
          }
        }
      ]
    });

    const processed = gameReducer(withStale, { type: "PROCESS_NEXT_EVENT" });

    expect(processed.session.version).toBe(8);
    expect(processed.session.selectedSpecKey).toBeNull();
    expect(processed.lastSeenEventId).toBe(30);
  });

  it("handles post response before duplicate realtime", () => {
    const session = cloneSessionState(initialMockState);
    const ui = createInitialUiState(session, "realtime");

    const afterPost = gameReducer(ui, {
      type: "APPLY_ACTION_RESPONSE",
      session: {
        ...session,
        selectedSpecKey: "range",
        selectedByPlayerId: "p1",
        version: session.version + 1
      },
      lastSeenEventId: 41
    });

    const withDuplicateRealtime = gameReducer(afterPost, {
      type: "ENQUEUE_EVENTS",
      events: [
        {
          id: 41,
          payload: {
            type: "state_updated",
            payload: {
              state: {
                ...session,
                version: session.version + 1,
                selectedSpecKey: "range",
                selectedByPlayerId: "p1"
              }
            },
            at: new Date().toISOString()
          }
        }
      ]
    });

    const processed = gameReducer(withDuplicateRealtime, { type: "PROCESS_NEXT_EVENT" });

    expect(processed.session.selectedSpecKey).toBe("range");
    expect(processed.lastSeenEventId).toBe(41);
  });
});
