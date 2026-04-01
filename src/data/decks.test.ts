import { describe, expect, it } from "vitest";
import { getDeckById, getDeckCards, getVisibleDecks } from "./decks";

describe("deck catalog", () => {
  it("exposes three visible decks", () => {
    const decks = getVisibleDecks();
    expect(decks.length).toBe(3);
    expect(decks.every((deck) => deck.isHidden === false)).toBe(true);
  });

  it("resolves hidden deck only by exact id lookup", () => {
    const hidden = getDeckById("pirate-ships-v1");
    expect(hidden).not.toBeNull();
    expect(hidden?.isHidden).toBe(true);
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
});

