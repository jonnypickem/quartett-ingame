import { getDeckById, getVisibleDecks, sortDeckCatalog } from "../data/decks";
import { createMockSessionState } from "../state/mockState";
import type {
  ActionResponse,
  DeckCatalogItem,
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

export const fetchSessionBootstrap = async (
  sessionId: string,
  playerId?: string
): Promise<SessionBootstrapResponse> => {
  if (resolveRuntimeMode() !== "realtime") {
    return {
      state: createMockSessionState(sessionId),
      latestEventId: 0
    };
  }

  const endpoint = getEndpoint();
  const url = new URL(endpoint);
  url.searchParams.set("session", sessionId);
  const normalizedPlayerId = playerId?.trim();
  if (normalizedPlayerId) {
    url.searchParams.set("player", normalizedPlayerId);
  }

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

const isLegacyDeckEndpointError = (status: number, message: string): boolean => {
  if (status !== 400) {
    return false;
  }
  return message.toLowerCase().includes("missing session query parameter");
};

export const createSession = async (): Promise<SessionAccessResponse> => {
  assertRealtimeEnabled();
  const endpoint = getEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      kind: "CREATE_SESSION"
    })
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Create session request failed."));
  }

  return (await response.json()) as SessionAccessResponse;
};

export const joinSession = async (sessionCode: string): Promise<SessionAccessResponse> => {
  assertRealtimeEnabled();
  const endpoint = getEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      kind: "JOIN_SESSION",
      sessionCode
    })
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response, "Join session request failed."));
  }

  return (await response.json()) as SessionAccessResponse;
};

export const fetchDeckCatalog = async (): Promise<DeckCatalogItem[]> => {
  if (resolveRuntimeMode() !== "realtime") {
    return sortDeckCatalog(getVisibleDecks());
  }

  const endpoint = getEndpoint();
  const url = new URL(endpoint);
  url.searchParams.set("kind", "deck-catalog");

  const response = await fetch(url.toString(), {
    method: "GET"
  });

  if (!response.ok) {
    const message = await readErrorMessage(response, "Deck catalog request failed.");
    if (isLegacyDeckEndpointError(response.status, message)) {
      return sortDeckCatalog(getVisibleDecks());
    }
    throw new Error(message);
  }

  const decks = (await response.json()) as DeckCatalogItem[];
  return sortDeckCatalog(decks);
};

export const fetchDeckById = async (deckId: string | null | undefined): Promise<DeckCatalogItem | null> => {
  const normalizedDeckId = typeof deckId === "string" ? deckId.trim().toLowerCase() : "";
  if (!normalizedDeckId) {
    return null;
  }

  if (resolveRuntimeMode() !== "realtime") {
    return getDeckById(normalizedDeckId);
  }

  const endpoint = getEndpoint();
  const url = new URL(endpoint);
  url.searchParams.set("kind", "deck");
  url.searchParams.set("id", normalizedDeckId);

  const response = await fetch(url.toString(), {
    method: "GET"
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const message = await readErrorMessage(response, "Deck request failed.");
    if (isLegacyDeckEndpointError(response.status, message)) {
      return getDeckById(normalizedDeckId);
    }
    throw new Error(message);
  }

  return (await response.json()) as DeckCatalogItem;
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
