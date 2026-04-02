import { useEffect, useMemo, useRef, useState } from "react";
import { ActionBar } from "./components/ActionBar";
import { CardPanel } from "./components/CardPanel";
import { DeckSelector } from "./components/DeckSelector";
import { StatusBar } from "./components/StatusBar";
import { getVisibleDecks, sortDeckCatalog } from "./data/decks";
import { createSession, fetchDeckById, fetchDeckCatalog, joinSession } from "./lib/gameApi";
import { shareOrCopyInvite } from "./lib/share";
import { useGameSession } from "./hooks/useGameSession";
import type { DeckCatalogItem } from "./types/game";

const localPlayerKey = (sessionId: string) => `quartett.player.${sessionId}`;

const persistPlayer = (sessionId: string, playerId: string) => {
  localStorage.setItem(localPlayerKey(sessionId), playerId);
};

const recoverPlayer = (sessionId: string): string | null => {
  return localStorage.getItem(localPlayerKey(sessionId));
};

const clearPersistedPlayer = (sessionId: string) => {
  localStorage.removeItem(localPlayerKey(sessionId));
};

const goHome = () => {
  window.location.search = "";
};

const routeToJoinPage = () => {
  window.location.search = "?mode=join";
};

const routeToJoinCode = (sessionCode: string) => {
  window.location.search = `?join=${encodeURIComponent(sessionCode)}`;
};

const routeToSession = (
  sessionId: string,
  playerId: string,
  options?: {
    forceDeckSelection?: boolean;
  }
) => {
  persistPlayer(sessionId, playerId);
  const params = new URLSearchParams({
    session: sessionId,
    player: playerId
  });
  if (options?.forceDeckSelection) {
    params.set("deck", "select");
  }
  window.location.search = `?${params.toString()}`;
};

const recentSessionCards = [
  { name: "Military Jets", lastPlayed: "Deck ID: military-jets-v1", code: "MIL-JETS", icon: "jet" },
  { name: "Supercars", lastPlayed: "Deck ID: supercars-v1", code: "SUPERCARS", icon: "car" },
  { name: "Military Submarines", lastPlayed: "Deck ID: military-submarines-v1", code: "SUBS", icon: "sub" }
] as const;

const AppTopBar = ({ title, badge }: { title: string; badge?: string }) => {
  return (
    <header className="top-bar">
      <div>
        <p className="top-bar__brand">Quartett Pro</p>
        <h1 className="top-bar__title">{title}</h1>
      </div>
      {badge ? <span className="energy-pill">{badge}</span> : null}
    </header>
  );
};

const InvalidContext = ({ title, message }: { title: string; message: string }) => {
  return (
    <main className="fallback">
      <section className="context-error-card">
        <h2>{title}</h2>
        <p>{message}</p>
      </section>
    </main>
  );
};

const EntryScreen = ({ prefilledCode, joinOnly }: { prefilledCode: string; joinOnly: boolean }) => {
  const [joinCode, setJoinCode] = useState(prefilledCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<"join" | null>(joinOnly ? "join" : null);
  const isInviteJoin = joinOnly && Boolean(prefilledCode);

  const onCreate = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await createSession();
      routeToSession(response.state.sessionId, response.playerId, { forceDeckSelection: true });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to create game.";
      setError(message);
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (!joinCode.trim()) {
      setError("Please enter an invite code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await joinSession(joinCode.trim().toUpperCase());
      routeToSession(response.state.sessionId, response.playerId);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to join game.";
      setError(message);
      setBusy(false);
    }
  };

  return (
    <main className="app-shell app-shell--entry">
      <section className={`landing-screen ${joinOnly ? "landing-screen--join" : ""}`}>
        <header className="landing-header" aria-label="Quartett top bar">
          <p className="landing-header__brand">Quartett Pro</p>
        </header>

        <section className="landing-hero">
          <h1>{joinOnly ? "Join The Round" : "Collect. Battle. Win."}</h1>
          <p>
            {joinOnly
              ? "Use your invite details below and jump into the lobby."
              : "Pick your duel mode and jump right back into action."}
          </p>

          {!joinOnly ? (
            <div className="hero-card-stack" aria-hidden="true">
              <article className="hero-card hero-card--back hero-card--back-left">
                <div className="hero-card__art hero-card__art--back-left" />
              </article>
              <article className="hero-card hero-card--back hero-card--back-right">
                <div className="hero-card__art hero-card__art--back-right" />
              </article>
              <article className="hero-card hero-card--front">
                <span className="hero-card__badge">Legendary</span>
                <div className="hero-card__art hero-card__art--front">Qnash-O-Matic</div>
                <p className="hero-card__stats">Pow: 95 · Spd: 40</p>
              </article>
            </div>
          ) : null}
        </section>

        <section className="landing-sheet">
          <div className="landing-actions">
            {!joinOnly ? (
              <button
                type="button"
                className="btn-primary landing-action-btn"
                disabled={busy}
                onClick={() => void onCreate()}
              >
                {busy ? "Creating..." : "Create Game"}
              </button>
            ) : null}

            <button
              type="button"
              className="btn-secondary landing-action-btn"
              disabled={busy}
              onClick={() => {
                setError(null);
                if (!joinOnly) {
                  routeToJoinPage();
                  return;
                }
                setActivePanel("join");
              }}
            >
              {joinOnly ? "Join This Round" : "Join Round"}
            </button>
          </div>

          <div className={`landing-form-drawer ${activePanel ? "landing-form-drawer--open" : ""}`}>
            {activePanel === "join" ? (
              <form
                className="landing-form"
                onSubmit={(event) => {
                  event.preventDefault();
                  void onJoin();
                }}
              >
                <h2>{joinOnly ? "Join With Invite" : "Join Lobby"}</h2>
                {joinOnly ? (
                  <input
                    value={joinCode}
                    onChange={(event) => {
                      if (isInviteJoin) {
                        return;
                      }
                      setJoinCode(event.target.value);
                    }}
                    readOnly={isInviteJoin}
                    className={`session-input ${isInviteJoin ? "session-input--readonly" : ""}`}
                  />
                ) : (
                  <input
                    value={joinCode}
                    onChange={(event) => setJoinCode(event.target.value)}
                    placeholder="Invite code"
                    className="session-input"
                  />
                )}
                <button type="submit" className="btn-secondary" disabled={busy}>
                  {busy ? "Joining..." : "Join Lobby"}
                </button>
              </form>
            ) : null}
          </div>

          {!joinOnly ? (
            <section className="last-sessions" aria-label="Last sessions">
              <h2>Last Sessions</h2>
              <ul className="last-sessions__list">
                {recentSessionCards.map((sessionCard) => (
                  <li key={sessionCard.code}>
                    <div className={`session-pill session-pill--${sessionCard.icon}`} aria-hidden="true" />
                    <div className="session-meta">
                      <p>{sessionCard.name}</p>
                      <span>{sessionCard.lastPlayed}</span>
                    </div>
                    <button
                      type="button"
                      className="session-play-btn"
                      onClick={() => {
                        window.location.search = `?mode=join&code=${encodeURIComponent(sessionCard.code)}`;
                      }}
                    >
                      Play
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : (
            <button type="button" className="btn-tertiary landing-back-btn" onClick={goHome}>
              Back To Home
            </button>
          )}

          {error ? <p className="error-inline">{error}</p> : null}
        </section>
      </section>
    </main>
  );
};

const SessionScreen = ({
  sessionId,
  playerId,
  forceDeckSelection
}: {
  sessionId: string;
  playerId: string;
  forceDeckSelection: boolean;
}) => {
  const {
    state,
    runtimeMode,
    view,
    yourPlayer,
    opponent,
    selectSpec,
    sendTopCard,
    selectDeck,
    startGame,
    respondTransfer,
    startTie,
    loseTie,
    respondTie,
    connectionStatus,
    contextError,
    clearError
  } = useGameSession(sessionId, playerId);

  const session = state.session;
  const isHost = session.hostPlayerId === playerId;
  const showRuntimeWarning = !import.meta.env.DEV && runtimeMode === "local-mock";
  const joinUrl = `${window.location.origin}/?join=${encodeURIComponent(session.sessionCode)}`;
  const [inviteMessage, setInviteMessage] = useState<string | null>(null);
  const [deckCatalog, setDeckCatalog] = useState<DeckCatalogItem[]>(() => sortDeckCatalog(getVisibleDecks()));
  const [selectedDeck, setSelectedDeck] = useState<DeckCatalogItem | null>(null);
  const [showDeckSelector, setShowDeckSelector] = useState(false);
  const [forceDeckGateOpen, setForceDeckGateOpen] = useState(forceDeckSelection);
  const [receiveFlightKey, setReceiveFlightKey] = useState(0);
  const previousRef = useRef<{
    pendingTransferId: string | null;
    incomingTransferForMe: boolean;
    yourCount: number;
  } | null>(null);

  useEffect(() => {
    if (session.status === "running") {
      document.documentElement.classList.add("no-viewport-scroll");
      document.body.classList.add("no-viewport-scroll");
    } else {
      document.documentElement.classList.remove("no-viewport-scroll");
      document.body.classList.remove("no-viewport-scroll");
    }

    return () => {
      document.documentElement.classList.remove("no-viewport-scroll");
      document.body.classList.remove("no-viewport-scroll");
    };
  }, [session.status]);

  useEffect(() => {
    const previous = previousRef.current;
    const currentPending = view.pendingTransfer;
    const incomingForMe = Boolean(currentPending && currentPending.toPlayerId === playerId);

    if (
      previous &&
      previous.pendingTransferId &&
      previous.incomingTransferForMe &&
      !currentPending &&
      view.yourCount > previous.yourCount
    ) {
      setReceiveFlightKey((value) => value + 1);
    }

    previousRef.current = {
      pendingTransferId: currentPending?.id ?? null,
      incomingTransferForMe: incomingForMe,
      yourCount: view.yourCount
    };
  }, [playerId, view.pendingTransfer, view.yourCount]);

  useEffect(() => {
    if (!inviteMessage) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setInviteMessage(null);
    }, 3200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [inviteMessage]);

  useEffect(() => {
    if (session.status !== "lobby") {
      return;
    }
    let cancelled = false;

    const loadCatalog = async () => {
      try {
        const decks = await fetchDeckCatalog();
        if (!cancelled) {
          setDeckCatalog(sortDeckCatalog(decks.length > 0 ? decks : getVisibleDecks()));
        }
      } catch {
        if (!cancelled) {
          setDeckCatalog(sortDeckCatalog(getVisibleDecks()));
        }
      }
    };

    void loadCatalog();

    return () => {
      cancelled = true;
    };
  }, [session.status]);

  useEffect(() => {
    if (!session.deckId) {
      setSelectedDeck(null);
      return;
    }

    const currentDeckId = session.deckId;
    let cancelled = false;
    const loadCurrentDeck = async () => {
      const deck = await fetchDeckById(currentDeckId);
      if (!cancelled) {
        setSelectedDeck(deck);
      }
    };
    void loadCurrentDeck();
    return () => {
      cancelled = true;
    };
  }, [session.deckId]);

  useEffect(() => {
    if (session.status === "lobby" && isHost && !session.deckId) {
      setShowDeckSelector(true);
    }
  }, [isHost, session.deckId, session.status]);

  useEffect(() => {
    if (!forceDeckSelection) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("deck") === "select") {
      params.delete("deck");
      const query = params.toString();
      window.history.replaceState({}, "", query ? `${window.location.pathname}?${query}` : window.location.pathname);
    }
  }, [forceDeckSelection]);

  const shareJoinLink = async () => {
    const message = await shareOrCopyInvite(session.sessionCode, joinUrl);
    setInviteMessage(message);
  };

  if (contextError) {
    if (contextError.code === "player_not_in_session") {
      return (
        <main className="fallback">
          <section className="context-error-card">
            <h2>Session Error</h2>
            <p>{contextError.message}</p>
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                clearPersistedPlayer(sessionId);
                routeToJoinCode(session.sessionCode);
              }}
            >
              Rejoin With Code
            </button>
          </section>
        </main>
      );
    }
    return <InvalidContext title="Session Error" message={contextError.message} />;
  }

  if (!yourPlayer) {
    if (connectionStatus === "bootstrapping" || state.busy) {
      return <main className="fallback">Loading session...</main>;
    }

    if (state.lastError) {
      return <InvalidContext title="Session Error" message={state.lastError} />;
    }

    return (
      <main className="fallback">
        <section className="context-error-card">
          <h2>Session Error</h2>
          <p>We could not restore your player seat for this session.</p>
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              clearPersistedPlayer(sessionId);
              routeToJoinCode(session.sessionCode);
            }}
          >
            Rejoin With Code
          </button>
        </section>
      </main>
    );
  }

  if (session.status === "lobby") {
    const canStart = isHost && session.players.length === 2 && Boolean(session.deckId) && !state.busy;
    const mustSelectDeck = isHost && !session.deckId;
    const shouldForceDeckSelection = isHost && forceDeckGateOpen;

    if (showDeckSelector || mustSelectDeck || shouldForceDeckSelection) {
      return (
        <DeckSelector
          decks={deckCatalog}
          selectedDeckId={session.deckId}
          busy={state.busy}
          errorMessage={state.lastError}
          onSelectDeck={selectDeck}
          onResolveDeckById={fetchDeckById}
          onSelectionConfirmed={() => {
            setShowDeckSelector(false);
            setForceDeckGateOpen(false);
          }}
        />
      );
    }

    if (!session.deckId) {
      return (
        <main className="app-shell app-shell--entry">
          <section className="game-screen game-screen--entry game-screen--lobby">
            <AppTopBar title="Lobby" badge={session.sessionCode} />
            <section className="request-box request-box--lobby">
              <h2>Waiting For Deck Selection</h2>
              <p>Host is choosing a deck. Lobby details will appear right after deck selection.</p>
            </section>
          </section>
        </main>
      );
    }

    return (
      <main className="app-shell app-shell--entry">
        <section className="game-screen game-screen--entry game-screen--lobby">
          <AppTopBar title="Lobby" badge={session.sessionCode} />

          {showRuntimeWarning ? (
            <div className="runtime-warning" role="alert">
              Realtime is not configured. Lobby updates require backend connection.
            </div>
          ) : null}

          {state.lastError ? (
            <div className="error-banner" role="alert">
              <span>{state.lastError}</span>
              <button type="button" onClick={clearError}>
                Dismiss
              </button>
            </div>
          ) : null}

          <div className="lobby-layout">
            <section className="request-box request-box--lobby">
              <h2>Invite Your Opponent</h2>
              <p className="lobby-invite-code">{session.sessionCode}</p>
              <p className="lobby-link-label">Share link</p>
              <a href={joinUrl} className="lobby-link" target="_blank" rel="noreferrer">
                {joinUrl}
              </a>
              <div className="lobby-share-row">
                <button type="button" className="btn-secondary" onClick={() => void shareJoinLink()}>
                  Share Invite
                </button>
              </div>
              {inviteMessage ? <p className="lobby-hint">{inviteMessage}</p> : null}
              <img
                className="qr-image"
                alt="Join session QR code"
                src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(joinUrl)}`}
              />
            </section>

            <section className="request-box request-box--lobby">
              <h2>Ready Squad</h2>
              <p>{session.players.length}/2 players connected</p>
              <div className="lobby-deck-summary">
                <span>Selected deck</span>
                <strong>{selectedDeck?.name ?? "Not selected yet"}</strong>
                <small>{selectedDeck?.id ?? "Host must pick a deck first."}</small>
                {isHost ? (
                  <button type="button" className="btn-secondary" onClick={() => setShowDeckSelector(true)} disabled={state.busy}>
                    Change Deck
                  </button>
                ) : null}
              </div>
              <ul className="roster-list">
                {session.players.map((player) => (
                  <li key={player.id}>
                    <span>{player.id === playerId ? "You" : "Opponent"}</span>
                    <span className="roster-role">{player.id === session.hostPlayerId ? "Host" : "Ready"}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <button
            type="button"
            className="btn-primary"
            disabled={!canStart}
            onClick={() => void startGame()}
          >
            {isHost ? (session.deckId ? "Start Game" : "Select Deck First") : "Waiting For Host"}
          </button>
        </section>
      </main>
    );
  }

  if (session.status === "finished") {
    const winner = session.players.find((player) => player.id === session.winnerPlayerId);
    const ranking = [...session.players].sort((a, b) => b.hand.length - a.hand.length);
    const winnerLabel = winner?.id === playerId ? "You" : winner ? "Opponent" : "Unknown";

    return (
      <main className="app-shell app-shell--entry">
        <section className="game-screen game-screen--entry game-screen--finish">
          <AppTopBar title="Final Rankings" />

          <section className="winner-callout" aria-label="Winner summary">
            <p className="winner-callout__label">Winner</p>
            <h2>{winnerLabel}</h2>
            <p className="winner-callout__subline">Domination achieved</p>
          </section>

          <ul className="finish-list">
            {ranking.map((player, index) => (
              <li key={player.id} className={index === 0 ? "finish-list__item finish-list__item--winner" : "finish-list__item"}>
                <span>
                  {String(index + 1).padStart(2, "0")} {player.id === playerId ? "You" : "Opponent"}
                </span>
                <strong>{player.hand.length} cards</strong>
              </li>
            ))}
          </ul>

          <button type="button" className="btn-primary" onClick={goHome}>
            Back To Landing
          </button>
        </section>
      </main>
    );
  }

  if (!opponent) {
    return <main className="fallback">Waiting for opponent...</main>;
  }

  const selectedByColor = session.players.find((player) => player.id === view.selectedByPlayerId)?.color ?? null;

  const canSwipeSend = !state.busy && Boolean(view.yourTopCard) && !view.pendingTransfer;
  const incomingTransfer = view.pendingTransfer?.toPlayerId === playerId ? view.pendingTransfer : null;
  const outgoingTransfer = view.pendingTransfer?.fromPlayerId === playerId ? view.pendingTransfer : null;
  const tieAwaitingMe = view.loseTieRequest?.winnerPlayerId === playerId;
  const tieWaitingOther = view.loseTieRequest?.loserPlayerId === playerId;
  const tieActiveWithoutRequest = view.tieState.active && !view.loseTieRequest;

  let tieLabel = "Tie";
  let tieDisabled = state.busy || !view.yourTopCard || Boolean(view.pendingTransfer);
  let onTieAction = async () => {
    await startTie();
  };

  if (tieActiveWithoutRequest) {
    tieLabel = "Lost Tie";
    tieDisabled = state.busy || Boolean(view.pendingTransfer);
    onTieAction = async () => {
      await loseTie();
    };
  }

  if (tieAwaitingMe) {
    tieLabel = "Accept Tie";
    tieDisabled = state.busy;
    onTieAction = async () => {
      await respondTie("accepted");
    };
  }

  if (tieWaitingOther) {
    tieLabel = "Tie Pending";
    tieDisabled = true;
    onTieAction = async () => undefined;
  }

  const cardOverlayContent = (() => {
    if (incomingTransfer) {
      return (
        <div className="card-request">
          <p>
            Opponent sends <strong>{incomingTransfer.cardId}</strong>. Accept?
          </p>
          <div className="card-request__actions">
            <button type="button" className="btn-mini btn-mini--accept" onClick={() => void respondTransfer("accepted")}>
              Accept
            </button>
            <button type="button" className="btn-mini btn-mini--decline" onClick={() => void respondTransfer("declined")}>
              Decline
            </button>
          </div>
        </div>
      );
    }

    if (tieAwaitingMe) {
      return (
        <div className="card-request">
          <p>Tie resolution requested. Accept or decline.</p>
          <div className="card-request__actions">
            <button type="button" className="btn-mini btn-mini--accept" onClick={() => void respondTie("accepted")}>
              Accept Tie
            </button>
            <button type="button" className="btn-mini btn-mini--decline" onClick={() => void respondTie("declined")}>
              Decline Tie
            </button>
          </div>
        </div>
      );
    }

    if (outgoingTransfer) {
      return <p>Waiting for Opponent to respond to your send request.</p>;
    }

    if (tieWaitingOther) {
      return <p>Waiting for Opponent to respond to your lost-tie request.</p>;
    }

    if (state.lastError) {
      return (
        <div className="card-request">
          <p>{state.lastError}</p>
          <div className="card-request__actions">
            <button type="button" className="btn-mini btn-mini--decline" onClick={clearError}>
              Dismiss
            </button>
          </div>
        </div>
      );
    }

    if (showRuntimeWarning) {
      return <p>Realtime is not configured for this environment. Running in local mock mode.</p>;
    }

    return null;
  })();

  return (
    <main className="app-shell app-shell--gameplay">
      <section className="game-screen game-screen--gameplay">
        <div className="headline-row headline-row--gameplay">
          <div className="headline-row__title-wrap">
            <h1>Tactical Quartett</h1>
            <p className="headline-row__deck-name">{selectedDeck?.name ?? session.deckId ?? "No Deck Selected"}</p>
          </div>
          <span className="energy-pill">{session.sessionCode}</span>
        </div>

        <StatusBar
          yourCount={view.yourCount}
          opponentCount={view.opponentCount}
          busy={state.busy}
          connectionStatus={connectionStatus}
          runtimeMode={runtimeMode}
        />

        <div className="gameplay-flow">
          <CardPanel
            variant="you"
            playerName={yourPlayer.name}
            topCard={view.yourTopCard}
            selectedSpecKey={view.selectedSpecKey}
            selectedByColor={selectedByColor}
            onSelectSpec={selectSpec}
            swipeEnabled={canSwipeSend}
            onSwipeUp={sendTopCard}
            receiveFlightKey={receiveFlightKey}
            overlayContent={cardOverlayContent}
          />

          <ActionBar
            canSend={canSwipeSend}
            tieLabel={tieLabel}
            tieDisabled={tieDisabled}
            busy={state.busy}
            onSendCard={sendTopCard}
            onTieAction={onTieAction}
          />
        </div>
      </section>
    </main>
  );
};

function App() {
  const params = useMemo(() => new URLSearchParams(window.location.search), []);
  const sessionId = params.get("session")?.trim() ?? "";
  const playerId = params.get("player")?.trim() ?? "";
  const joinCode = params.get("join")?.trim().toUpperCase() ?? "";
  const forceDeckSelection = params.get("deck")?.trim().toLowerCase() === "select";
  const joinMode = params.get("mode")?.trim().toLowerCase() === "join";
  const code = params.get("code")?.trim().toUpperCase() ?? "";
  const prefilledCode = joinCode || code;

  if (!sessionId) {
    return <EntryScreen prefilledCode={prefilledCode} joinOnly={joinMode || Boolean(joinCode)} />;
  }

  if (!playerId) {
    const recoveredPlayer = recoverPlayer(sessionId);
    if (recoveredPlayer) {
      routeToSession(sessionId, recoveredPlayer);
      return <main className="fallback">Restoring session...</main>;
    }
    return (
      <InvalidContext
        title="Missing Player Context"
        message="Missing player in URL. Open the invite link from lobby or join with code from landing."
      />
    );
  }

  return <SessionScreen sessionId={sessionId} playerId={playerId} forceDeckSelection={forceDeckSelection} />;
}

export default App;
