import { createMockSessionState } from "../state/mockState";
import type {
  ActionResponse,
  GameActionRequest,
  RealtimeEventRow,
  RuntimeMode,
  SessionAccessResponse,
  SessionBootstrapResponse,
  SessionState
} from "../types/game";
import { applyGameAction } from "./gameEngine";
import { getSupabaseClient } from "./supabase";

const getEndpoint = (): string => import.meta.env.VITE_GAME_ACTION_ENDPOINT?.trim() ?? "";

const hasSupabaseConfig = (): boolean => {
  return Boolean(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
};

const readErrorMessage = async (response: Response, fallback: string): Promise<string> => {
  const text = (await response.text()).trim();
  if (!text) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(text) as { error?: unknown; message?: unknown };
    if (typeof parsed.error === "string" && parsed.error) {
      return parsed.error;
    }
    if (typeof parsed.message === "string" && parsed.message) {
      return parsed.message;
    }
  } catch {
    // Preserve plain-text responses when backend does not return JSON.
  }

  return text;
};

export const resolveRuntimeMode = (): RuntimeMode => {
  return getEndpoint() && hasSupabaseConfig() ? "realtime" : "local-mock";
};

export const fetchSessionBootstrap = async (sessionId: string): Promise<SessionBootstrapResponse> => {
  if (resolveRuntimeMode() !== "realtime") {
    return {
      state: createMockSessionState(sessionId),
      latestEventId: 0
    };
  }

  const endpoint = getEndpoint();
  const url = new URL(endpoint);
  url.searchParams.set("session", sessionId);

  const response = await fetch(url.toString(), {
    method: "GET"
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Bootstrap request failed."));
  }

  return (await response.json()) as SessionBootstrapResponse;
};

const assertRealtimeEnabled = () => {
  if (resolveRuntimeMode() !== "realtime") {
    throw new Error("Realtime backend is not configured.");
  }
};

export const createSession = async (playerName: string): Promise<SessionAccessResponse> => {
  assertRealtimeEnabled();
  const endpoint = getEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      kind: "CREATE_SESSION",
      playerName
    })
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Create session request failed."));
  }

  return (await response.json()) as SessionAccessResponse;
};

export const joinSession = async (playerName: string, sessionCode: string): Promise<SessionAccessResponse> => {
  assertRealtimeEnabled();
  const endpoint = getEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      kind: "JOIN_SESSION",
      playerName,
      sessionCode
    })
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Join session request failed."));
  }

  return (await response.json()) as SessionAccessResponse;
};

export const submitAction = async (
  request: GameActionRequest,
  currentState: SessionState
): Promise<ActionResponse> => {
  if (resolveRuntimeMode() === "realtime") {
    const endpoint = getEndpoint();
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(await readErrorMessage(response, "Game action request failed."));
    }

    return (await response.json()) as ActionResponse;
  }

  return applyGameAction(currentState, request);
};

export const subscribeToSessionEvents = (
  sessionId: string,
  onRow: (row: RealtimeEventRow) => void
): (() => void) => {
  if (resolveRuntimeMode() !== "realtime") {
    return () => undefined;
  }

  const client = getSupabaseClient();
  if (!client) {
    return () => undefined;
  }

  const channel = client.channel(`game-session-${sessionId}`);

  channel
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "game_events",
        filter: `session_id=eq.${sessionId}`
      },
      (payload) => {
        const row = payload.new as { id?: number; payload?: RealtimeEventRow["payload"] };
        if (typeof row.id === "number" && row.payload) {
          onRow({
            id: row.id,
            payload: row.payload
          });
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};
