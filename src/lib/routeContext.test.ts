import { describe, expect, it } from "vitest";
import { createMockSessionState } from "../state/mockState";
import {
  buildPerspectiveUrl,
  parseSessionRouteContext,
  validatePlayerInSession
} from "./routeContext";

describe("routeContext", () => {
  it("parses session and player from URL search", () => {
    const result = parseSessionRouteContext("?session=session-1&player=p1");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.context.sessionId).toBe("session-1");
      expect(result.context.playerId).toBe("p1");
    }
  });

  it("returns missing_session when session query param is absent", () => {
    const result = parseSessionRouteContext("?player=p1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("missing_session");
    }
  });

  it("returns unknown_player when player query param is absent", () => {
    const result = parseSessionRouteContext("?session=session-1");

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.code).toBe("unknown_player");
    }
  });

  it("validates player membership in session", () => {
    const session = createMockSessionState("session-77");

    const ok = validatePlayerInSession(session, "p1");
    const bad = validatePlayerInSession(session, "p9");

    expect(ok.ok).toBe(true);
    expect(bad.ok).toBe(false);
    if (!bad.ok) {
      expect(bad.code).toBe("player_not_in_session");
    }
  });

  it("builds perspective URL", () => {
    const url = buildPerspectiveUrl("session-7", "p2");
    expect(url).toBe("/?session=session-7&player=p2");
  });
});
