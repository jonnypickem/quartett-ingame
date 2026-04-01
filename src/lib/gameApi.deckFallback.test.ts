import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDeckById, getVisibleDecks } from "../data/decks";
import { fetchDeckById, fetchDeckCatalog } from "./gameApi";

describe("gameApi deck fallback", () => {
  beforeEach(() => {
    (import.meta.env as Record<string, string>).VITE_GAME_ACTION_ENDPOINT = "https://example.test/game-action";
    (import.meta.env as Record<string, string>).VITE_SUPABASE_URL = "https://example.test";
    (import.meta.env as Record<string, string>).VITE_SUPABASE_ANON_KEY = "anon-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("falls back to local visible catalog when legacy backend rejects kind query", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Missing session query parameter." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    );

    const decks = await fetchDeckCatalog();

    expect(decks).toEqual(getVisibleDecks());
  });

  it("falls back to local exact deck lookup when legacy backend rejects kind query", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Missing session query parameter." }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      })
    );

    const deck = await fetchDeckById("military-jets-v1");

    expect(deck).toEqual(getDeckById("military-jets-v1"));
  });
});

