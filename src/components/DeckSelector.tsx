import { useMemo, useRef, useState } from "react";
import type { DeckCatalogItem } from "../types/game";

interface DeckSelectorProps {
  decks: DeckCatalogItem[];
  selectedDeckId: string | null;
  busy: boolean;
  onSelectDeck: (deckId: string) => Promise<boolean>;
  onResolveDeckById: (deckId: string) => Promise<DeckCatalogItem | null>;
  onDone: () => void;
}

const normalize = (value: string) => value.trim().toLowerCase();

export const DeckSelector = ({
  decks,
  selectedDeckId,
  busy,
  onSelectDeck,
  onResolveDeckById,
  onDone
}: DeckSelectorProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DeckCatalogItem | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);

  const normalizedTerm = normalize(searchTerm);

  const visibleMatches = useMemo(() => {
    if (!normalizedTerm) {
      return decks;
    }

    return decks.filter((deck) => {
      const name = deck.name.toLowerCase();
      const id = deck.id.toLowerCase();
      return name.includes(normalizedTerm) || id.includes(normalizedTerm);
    });
  }, [decks, normalizedTerm]);

  const scrollToSlide = (index: number) => {
    const track = trackRef.current;
    if (!track) {
      return;
    }
    const slideWidth = track.clientWidth;
    track.scrollTo({
      left: slideWidth * index,
      behavior: "smooth"
    });
  };

  const lookupExactDeck = async () => {
    if (!normalizedTerm) {
      setSearchMessage("Enter a deck name or deck ID.");
      setSearchResult(null);
      return;
    }

    setSearching(true);
    setSearchMessage(null);
    try {
      const deck = await onResolveDeckById(normalizedTerm);
      if (!deck) {
        setSearchResult(null);
        setSearchMessage("Deck not found.");
        return;
      }
      setSearchResult(deck);
    } finally {
      setSearching(false);
    }
  };

  const handleSelect = async (deckId: string) => {
    const chosen = [...decks, ...(searchResult ? [searchResult] : [])].find((deck) => deck.id === deckId);
    if (chosen && chosen.cardCount !== 32) {
      setSearchMessage("This deck is not tournament-ready yet (needs 32 cards).");
      return;
    }
    const ok = await onSelectDeck(deckId);
    if (ok) {
      onDone();
    }
  };

  return (
    <main className="deck-selector-screen">
      <header className="deck-selector-top">
        <p>Choose your deck</p>
        <button type="button" className="btn-secondary" onClick={onDone} disabled={busy}>
          Done
        </button>
      </header>

      <div className="deck-selector-track" ref={trackRef}>
        {decks.map((deck) => (
          <section key={deck.id} className="deck-slide">
            <article className="deck-slide-card">
              <img src={deck.coverImageUrl} alt={deck.name} className="deck-slide-cover" />
              <h2>{deck.name}</h2>
              <p>{deck.description}</p>
              <span>{deck.cardCount} cards</span>
              <button
                type="button"
                className="btn-primary"
                disabled={busy || deck.cardCount !== 32}
                onClick={() => void handleSelect(deck.id)}
              >
                {deck.cardCount !== 32 ? "Deck Incomplete" : selectedDeckId === deck.id ? "Selected" : "Select Deck"}
              </button>
            </article>
          </section>
        ))}

        <section className="deck-slide">
          <article className="deck-slide-card deck-slide-card--search">
            <h2>Find Deck By ID</h2>
            <p>Visible decks can be searched by name or ID. Hidden decks require exact ID.</p>
            <input
              className="session-input"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchMessage(null);
                setSearchResult(null);
              }}
              placeholder="Type deck name or exact deck ID"
            />
            <button type="button" className="btn-secondary" disabled={searching} onClick={() => void lookupExactDeck()}>
              {searching ? "Searching..." : "Search Deck"}
            </button>

            <div className="deck-search-results">
              {visibleMatches.slice(0, 3).map((deck) => (
                <button key={deck.id} type="button" className="deck-search-result" onClick={() => void handleSelect(deck.id)}>
                  <span>{deck.name}</span>
                  <small>{deck.id}</small>
                </button>
              ))}
              {searchResult ? (
                <button type="button" className="deck-search-result deck-search-result--exact" onClick={() => void handleSelect(searchResult.id)}>
                  <span>{searchResult.name}</span>
                  <small>{searchResult.id}</small>
                </button>
              ) : null}
              {searchMessage ? <p className="deck-search-message">{searchMessage}</p> : null}
            </div>
          </article>
        </section>
      </div>

      <footer className="deck-selector-nav">
        {decks.map((deck, index) => (
          <button key={deck.id} type="button" className="deck-selector-nav__dot" onClick={() => scrollToSlide(index)} aria-label={`Go to ${deck.name}`} />
        ))}
        <button type="button" className="deck-selector-nav__dot deck-selector-nav__dot--search" onClick={() => scrollToSlide(decks.length)} aria-label="Go to search slide" />
      </footer>
    </main>
  );
};
