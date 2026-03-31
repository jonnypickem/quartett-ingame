import type {
  SessionPlayerValidationResult,
  SessionRouteValidationResult,
  SessionState
} from "../types/game";

export const parseSessionRouteContext = (search: string): SessionRouteValidationResult => {
  const params = new URLSearchParams(search);
  const sessionId = params.get("session")?.trim() ?? "";
  const playerId = params.get("player")?.trim() ?? "";

  if (!sessionId) {
    return {
      ok: false,
      code: "missing_session",
      message: "Missing session in URL. Use ?session=<session-id>&player=<player-id>."
    };
  }

  if (!playerId) {
    return {
      ok: false,
      code: "unknown_player",
      message: "Missing player in URL. Use ?session=<session-id>&player=<player-id>."
    };
  }

  return {
    ok: true,
    context: {
      sessionId,
      playerId
    }
  };
};

export const validatePlayerInSession = (
  session: SessionState,
  playerId: string
): SessionPlayerValidationResult => {
  const exists = session.players.some((player) => player.id === playerId);
  if (exists) {
    return { ok: true };
  }

  return {
    ok: false,
    code: "player_not_in_session",
    message: `Player '${playerId}' is not part of session '${session.sessionId}'.`
  };
};

export const buildPerspectiveUrl = (sessionId: string, playerId: string): string => {
  return `/?session=${encodeURIComponent(sessionId)}&player=${encodeURIComponent(playerId)}`;
};
