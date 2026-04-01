import { describe, expect, it } from "vitest";
import { existsSync, statSync } from "node:fs";
import path from "node:path";
import { getDeckById, getDeckCards, getVisibleDecks } from "./decks";

describe("deck catalog", () => {
  it("exposes three visible decks", () => {
    const decks = getVisibleDecks();
    expect(decks.length).toBe(3);
    expect(decks.every((deck) => deck.isHidden === false)).toBe(true);
  });

  it("does not expose legacy placeholder decks", () => {
    const hidden = getDeckById("pirate-ships-v1");
    expect(hidden).toBeNull();
  });

  it("provides 32 cards and stable local asset paths for each visible deck", () => {
    const visible = getVisibleDecks();
    for (const deck of visible) {
      const cards = getDeckCards(deck.id);
      expect(cards.length).toBe(32);
      expect(cards.every((card) => card.imageUrl.startsWith(`/decks/${deck.id}/`))).toBe(true);
      expect(cards.every((card) => card.specs.length > 0)).toBe(true);
    }
  });

  it("has local image files for every visible card path", () => {
    const visible = getVisibleDecks();
    for (const deck of visible) {
      const cards = getDeckCards(deck.id);
      for (const card of cards) {
        const relativePath = card.imageUrl.replace(/^\//, "");
        const imagePath = path.join(process.cwd(), "public", relativePath);
        expect(existsSync(imagePath)).toBe(true);
        expect(statSync(imagePath).size).toBeGreaterThan(0);
      }
    }
  });
});
