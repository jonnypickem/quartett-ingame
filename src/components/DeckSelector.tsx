import { useEffect, useMemo, useRef, useState } from "react";
import type { DeckCatalogItem } from "../types/game";

interface DeckSelectorProps {
  decks: DeckCatalogItem[];
  selectedDeckId: string | null;
  busy: boolean;
  errorMessage?: string | null;
  onSelectDeck: (deckId: string) => Promise<boolean>;
  onResolveDeckByAccessCode: (accessCode: string) => Promise<DeckCatalogItem | null>;
  onSelectionConfirmed: () => void;
}

const normalize = (value: string) => value.trim().toLowerCase();

export const DeckSelector = ({
  decks,
  selectedDeckId,
  busy,
  errorMessage,
  onSelectDeck,
  onResolveDeckByAccessCode,
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
  const [currentSlideIndex, setCurrentSlideIndex] = useState(() => {
    if (!selectedDeckId) {
      return 0;
    }
    const selectedIndex = decks.findIndex((deck) => deck.id === selectedDeckId);
    return selectedIndex >= 0 ? selectedIndex : 0;
  });

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

  useEffect(() => {
    if (currentSlideIndex >= decks.length) {
      return;
    }
    const focusedDeckId = decks[currentSlideIndex]?.id;
    if (!focusedDeckId) {
      return;
    }
    setPendingDeckId((current) => (current === focusedDeckId ? current : focusedDeckId));
    setFooterMessage(null);
  }, [currentSlideIndex, decks]);

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
      const viewportCenter = track.scrollLeft + track.clientWidth / 2;
      let closestIndex = 0;
      let closestDistance = Number.POSITIVE_INFINITY;

      slideRefs.current.forEach((slide, index) => {
        if (!slide) {
          return;
        }
        const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
        const distance = Math.abs(slideCenter - viewportCenter);
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
    const track = trackRef.current;
    const targetIndex = Math.max(0, Math.min(index, totalSlides - 1));
    const slide = slideRefs.current[targetIndex];
    if (!track || !slide) {
      return;
    }
    track.scrollTo({
      left: slide.offsetLeft,
      behavior: "smooth"
    });
    setCurrentSlideIndex(targetIndex);
  };

  const lookupExactDeck = async () => {
    if (!normalizedTerm) {
      setSearchMessage("Enter the 6-digit access code.");
      setSearchResult(null);
      return;
    }

    if (!/^\d{6}$/.test(normalizedTerm)) {
      setSearchMessage("Access code must be exactly 6 digits.");
      setSearchResult(null);
      return;
    }

    setSearching(true);
    setSearchMessage(null);
    try {
      const deck = await onResolveDeckByAccessCode(normalizedTerm);
      if (!deck) {
        setSearchResult(null);
        setSearchMessage("Deck not found.");
        return;
      }
      setSearchResult(deck);
      setFooterMessage(null);

      const visibleIndex = decks.findIndex((entry) => entry.id === deck.id);
      if (visibleIndex >= 0) {
        scrollToSlide(visibleIndex);
      } else {
        setPendingDeckId(deck.id);
        scrollToSlide(decks.length);
      }
    } finally {
      setSearching(false);
    }
  };

  const handleConfirm = async () => {
    setFooterMessage(null);

    const deckIdForSubmit = currentSlideIndex < decks.length ? decks[currentSlideIndex]?.id ?? pendingDeckId : pendingDeckId;
    if (!deckIdForSubmit) {
      setFooterMessage("Choose a deck first.");
      return;
    }

    const chosen = [...decks, ...(searchResult ? [searchResult] : [])].find((deck) => deck.id === deckIdForSubmit);
    if (chosen && chosen.cardCount !== 32) {
      setFooterMessage("This deck is not tournament-ready yet (needs 32 cards).");
      return;
    }

    const ok = await onSelectDeck(deckIdForSubmit);
    if (ok) {
      onSelectionConfirmed();
      return;
    }
    setFooterMessage(errorMessage ?? "Could not create lobby from this deck.");
  };

  return (
    <main className="deck-selector-screen">
      <header className="deck-selector-top">
        <p>Choose your deck</p>
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
            <article className={`deck-slide-card ${currentSlideIndex === index ? "deck-slide-card--active" : ""}`}>
              <img src={deck.coverImageUrl} alt={deck.name} className="deck-slide-cover" />
              <div className="deck-slide-title-row">
                <h2>{deck.name}</h2>
                <small className="deck-slide-id">{deck.id}</small>
              </div>
              <p>{deck.description}</p>
              <span className="deck-slide-count">{deck.cardCount} cards</span>
              <strong className="deck-slide-state">
                {deck.cardCount !== 32 ? "Deck Incomplete" : currentSlideIndex === index ? "Selected Deck" : "Swipe To Focus"}
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
            <h2>Find Hidden Deck</h2>
            <p>This search only accepts an exact 6-digit access code.</p>
            <input
              className="session-input"
              value={searchTerm}
              onChange={(event) => {
                setSearchTerm(event.target.value);
                setSearchMessage(null);
                setSearchResult(null);
              }}
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              placeholder="Enter 6-digit code"
            />
            <button type="button" className="btn-secondary" disabled={searching} onClick={() => void lookupExactDeck()}>
              {searching ? "Searching..." : "Find Deck"}
            </button>

            <div className="deck-search-results">
              {searchResult ? (
                <button
                  type="button"
                  className={`deck-search-result deck-search-result--exact ${pendingDeckId === searchResult.id ? "deck-search-result--active" : ""}`}
                  onClick={() => {
                    const visibleIndex = decks.findIndex((entry) => entry.id === searchResult.id);
                    if (visibleIndex >= 0) {
                      scrollToSlide(visibleIndex);
                    } else {
                      setPendingDeckId(searchResult.id);
                    }
                  }}
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
        <p className="deck-selector-current">{selectedDeck ? `Selected: ${selectedDeck.name}` : "No deck selected yet"}</p>
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
          {busy ? "Creating Lobby..." : "Create Lobby"}
        </button>
        {footerMessage ? <p className="deck-selector-feedback">{footerMessage}</p> : null}
      </footer>
    </main>
  );
};
