import type { ActionResponse, GameActionRequest, GameEvent, SessionState } from "../types/game";
import { applyGameAction } from "./gameEngine";
import { getSupabaseClient } from "./supabase";

export const submitAction = async (
  request: GameActionRequest,
  currentState: SessionState
): Promise<ActionResponse> => {
  const endpoint = import.meta.env.VITE_GAME_ACTION_ENDPOINT;
  if (endpoint) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Game action request failed.");
    }

    return (await response.json()) as ActionResponse;
  }

  return applyGameAction(currentState, request);
};

export const subscribeToSessionEvents = (
  sessionId: string,
  onEvent: (event: GameEvent) => void
): (() => void) => {
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
        const row = payload.new as { payload?: GameEvent };
        if (row.payload) {
          onEvent(row.payload);
        }
      }
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
};

export const publishLocalEvents = (
  events: GameEvent[],
  enqueue: (events: GameEvent[]) => void
): void => {
  enqueue(events);
};
