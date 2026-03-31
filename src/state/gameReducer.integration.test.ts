import { describe, expect, it } from "vitest";
import { gameReducer, createInitialUiState } from "./gameReducer";
import { cloneSessionState, initialMockState } from "./mockState";

describe("gameReducer event queue", () => {
  it("processes queued events in deterministic order", () => {
    const session = cloneSessionState(initialMockState);
    const ui = createInitialUiState(session);

    const withEvents = gameReducer(ui, {
      type: "ENQUEUE_EVENTS",
      events: [
        {
          type: "spec_selected",
          payload: {
            playerId: "p1",
            specKey: "speed"
          },
          at: new Date().toISOString()
        },
        {
          type: "state_updated",
          payload: {
            state: {
              ...session,
              selectedSpecKey: "armor",
              selectedByPlayerId: "p2"
            }
          },
          at: new Date().toISOString()
        }
      ]
    });

    const afterFirst = gameReducer(withEvents, { type: "PROCESS_NEXT_EVENT" });
    const afterSecond = gameReducer(afterFirst, { type: "PROCESS_NEXT_EVENT" });

    expect(afterFirst.session.selectedSpecKey).toBe("speed");
    expect(afterSecond.session.selectedSpecKey).toBe("armor");
    expect(afterSecond.session.selectedByPlayerId).toBe("p2");
    expect(afterSecond.eventQueue.length).toBe(0);
  });
});
