import { useEffect, useMemo, useRef, useState } from "react";
import type { DeckCatalogItem } from "../types/game";

interface DeckSelectorProps {
  decks: DeckCatalogItem[];
  selectedDeckId: string | null;
  busy: boolean;
  errorMessage?: string | null;
  onSelectDeck: (deckId: string) => Promise<boolean>;
  onResolveDeckById: (deckId: string) => Promise<DeckCatalogItem | null>;
  onSelectionConfirmed: () => void;
}

const normalize = (value: string) => value.trim().toLowerCase();

export const DeckSelector = ({
  decks,
  selectedDeckId,
  busy,
  errorMessage,
  onSelectDeck,
  onResolveDeckById,
  onSelectionConfirmed
}: DeckSelectorProps) => {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const slideRefs = useRef<Array<HTMLElement | null>>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResult, setSearchResult] = useState<DeckCatalogItem | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [footerMessage, setFooterMessage] = useState<string | null>(null);
  const [pendingDeckId, setPendingDeckId] = useState<string | null>(selectedDeckId ?? null);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const normalizedTerm = normalize(searchTerm);
  const totalSlides = decks.length + 1;

  useEffect(() => {
    if (selectedDeckId) {
      setPendingDeckId(selectedDeckId);
    }
  }, [selectedDeckId]);

  useEffect(() => {
    if (!pendingDeckId && decks.length > 0) {
      setPendingDeckId(selectedDeckId ?? decks[0].id);
    }
  }, [decks, pendingDeckId, selectedDeckId]);

  useEffect(() => {
    if (!errorMessage) {
      return;
    }
    setFooterMessage(errorMessage);
  }, [errorMessage]);

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

  const selectedDeck = useMemo(() => {
    const candidateDecks = searchResult ? [...decks, searchResult] : decks;
    return candidateDecks.find((deck) => deck.id === pendingDeckId) ?? null;
  }, [decks, pendingDeckId, searchResult]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) {
      return;
    }

    let frame = 0;
    const updateActiveSlide = () => {
      frame = 0;
      const scrollLeft = track.scrollLeft;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      slideRefs.current.forEach((slide, index) => {
        if (!slide) {
          return;
        }
        const distance = Math.abs(slide.offsetLeft - scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      setCurrentSlideIndex(closestIndex);
    };

    const onScroll = () => {
      if (frame) {
        return;
      }
      frame = window.requestAnimationFrame(updateActiveSlide);
    };

    updateActiveSlide();
    track.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      track.removeEventListener("scroll", onScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [totalSlides]);

  const scrollToSlide = (index: number) => {
    const targetIndex = Math.max(0, Math.min(index, totalSlides - 1));
    const slide = slideRefs.current[targetIndex];
    if (!slide) {
      return;
    }
    slide.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "start"
    });
    setCurrentSlideIndex(targetIndex);
  };

  const chooseDeck = (deckId: string) => {
    setPendingDeckId(deckId);
    setSearchMessage(null);
    setFooterMessage(null);
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
      setPendingDeckId(deck.id);
      setFooterMessage(null);
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    setFooterMessage(null);

    if (!pendingDeckId) {
      setFooterMessage("Choose a deck first.");
      return;
    }

    const chosen = [...decks, ...(searchResult ? [searchResult] : [])].find((deck) => deck.id === pendingDeckId);
    if (chosen && chosen.cardCount !== 32) {
      setFooterMessage("This deck is not tournament-ready yet (needs 32 cards).");
      return;
    }

    const ok = await onSelectDeck(pendingDeckId);
    if (ok) {
      onSelectionConfirmed();
      return;
    }
    setFooterMessage(errorMessage ?? "Could not select deck. Please try again.");
  };

  return (
    <main className="deck-selector-screen">
      <header className="deck-selector-top">
        <p className="deck-selector-top__eyebrow">Host Setup</p>
        <h1>Choose your deck</h1>
        <span>Swipe packs or jump to hidden decks by exact ID.</span>
      </header>

      <div className="deck-selector-track" ref={trackRef}>
        {decks.map((deck, index) => (
          <section
            key={deck.id}
            className="deck-slide"
            ref={(node) => {
              slideRefs.current[index] = node;
            }}
          >
            <article
              className={`deck-slide-card ${pendingDeckId === deck.id ? "deck-slide-card--active" : ""}`}
              onClick={() => chooseDeck(deck.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  chooseDeck(deck.id);
                }
              }}
            >
              <img src={deck.coverImageUrl} alt={deck.name} className="deck-slide-cover" />
              <h2>{deck.name}</h2>
              <p>{deck.description}</p>
              <span>{deck.cardCount} cards</span>
              <small className="deck-slide-id">{deck.id}</small>
              <strong className="deck-slide-state">
                {deck.cardCount !== 32 ? "Deck Incomplete" : pendingDeckId === deck.id ? "Selected" : "Tap To Select"}
              </strong>
            </article>
          </section>
        ))}

        <section
          className="deck-slide"
          ref={(node) => {
            slideRefs.current[decks.length] = node;
          }}
        >
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
                <button
                  key={deck.id}
                  type="button"
                  className={`deck-search-result ${pendingDeckId === deck.id ? "deck-search-result--active" : ""}`}
                  onClick={() => chooseDeck(deck.id)}
                >
                  <span>{deck.name}</span>
                  <small>{deck.id}</small>
                </button>
              ))}
              {searchResult ? (
                <button
                  type="button"
                  className={`deck-search-result deck-search-result--exact ${pendingDeckId === searchResult.id ? "deck-search-result--active" : ""}`}
                  onClick={() => chooseDeck(searchResult.id)}
                >
                  <span>{searchResult.name}</span>
                  <small>{searchResult.id}</small>
                </button>
              ) : null}
              {searchMessage ? <p className="deck-search-message">{searchMessage}</p> : null}
            </div>
          </article>
        </section>
      </div>

      <footer className="deck-selector-footer">
        <p className="deck-selector-current">
          {selectedDeck ? `Selected: ${selectedDeck.name}` : "No deck selected yet"}
        </p>
        <div className="deck-selector-nav">
          {decks.map((deck, index) => (
            <button
              key={deck.id}
              type="button"
              className={`deck-selector-nav__dot ${currentSlideIndex === index ? "deck-selector-nav__dot--active" : ""}`}
              onClick={() => scrollToSlide(index)}
              aria-label={`Go to ${deck.name}`}
              aria-pressed={currentSlideIndex === index}
            />
          ))}
          <button
            type="button"
            className={`deck-selector-nav__dot deck-selector-nav__dot--search ${currentSlideIndex === decks.length ? "deck-selector-nav__dot--active" : ""}`}
            onClick={() => scrollToSlide(decks.length)}
            aria-label="Go to search slide"
            aria-pressed={currentSlideIndex === decks.length}
          />
        </div>
        <button type="button" className="btn-primary deck-selector-submit" disabled={busy || !pendingDeckId} onClick={() => void handleConfirm()}>
          {busy ? "Selecting..." : "Select Deck"}
        </button>
        {footerMessage ? <p className="deck-selector-feedback">{footerMessage}</p> : null}
      </footer>
    </main>
  );
};
