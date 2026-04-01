import { useMemo, useState } from "react";
import { ActionBar } from "./components/ActionBar";
import { CardPanel } from "./components/CardPanel";
import { StatusBar } from "./components/StatusBar";
import { createSession, joinSession } from "./lib/gameApi";
import { useGameSession } from "./hooks/useGameSession";

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

const routeToSession = (sessionId: string, playerId: string) => {
  persistPlayer(sessionId, playerId);
  window.location.search = `?session=${encodeURIComponent(sessionId)}&player=${encodeURIComponent(playerId)}`;
};

const findSpecValue = (specKey: string, cardSpecs: { key: string; value: number }[]) => {
  return cardSpecs.find((spec) => spec.key === specKey)?.value ?? null;
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
  const [hostName, setHostName] = useState("");
  const [joinName, setJoinName] = useState("");
  const [joinCode, setJoinCode] = useState(prefilledCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCreate = async () => {
    if (!hostName.trim()) {
      setError("Please enter your name.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await createSession(hostName.trim());
      routeToSession(response.state.sessionId, response.playerId);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to create game.";
      setError(message);
      setBusy(false);
    }
  };

  const onJoin = async () => {
    if (!joinName.trim() || !joinCode.trim()) {
      setError("Please enter your name and invite code.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const response = await joinSession(joinName.trim(), joinCode.trim().toUpperCase());
      routeToSession(response.state.sessionId, response.playerId);
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Failed to join game.";
      setError(message);
      setBusy(false);
    }
  };

  return (
    <main className="fallback">
      <section className="context-error-card">
        <h2>{joinOnly ? "Join Session" : "Quartett Duel"}</h2>
        <p>{joinOnly ? "Enter your name to join this session." : "Create a new 1v1 session or join with invite code."}</p>
        {!joinOnly ? (
          <div className="request-box">
            <p>Create Game</p>
            <input
              value={hostName}
              onChange={(event) => setHostName(event.target.value)}
              placeholder="Your name"
              className="session-input"
            />
            <button type="button" className="btn-primary" disabled={busy} onClick={() => void onCreate()}>
              {busy ? "Creating..." : "Create Game"}
            </button>
          </div>
        ) : null}
        <div className="request-box">
          <p>{joinOnly ? "Join This Game" : "Join Game"}</p>
          <input
            value={joinName}
            onChange={(event) => setJoinName(event.target.value)}
            placeholder="Your name"
            className="session-input"
          />
          {joinOnly ? (
            <input value={joinCode} readOnly className="session-input session-input--readonly" />
          ) : (
            <input
              value={joinCode}
              onChange={(event) => setJoinCode(event.target.value)}
              placeholder="Invite code"
              className="session-input"
            />
          )}
          <button type="button" className="btn-secondary" disabled={busy} onClick={() => void onJoin()}>
            {busy ? "Joining..." : "Join Game"}
          </button>
        </div>
        {joinOnly ? (
          <button type="button" className="btn-tertiary" onClick={() => (window.location.search = "")}>
            Back To Home
          </button>
        ) : null}
        {error ? <p className="error-inline">{error}</p> : null}
      </section>
    </main>
  );
};

const SessionScreen = ({ sessionId, playerId }: { sessionId: string; playerId: string }) => {
  const {
    state,
    runtimeMode,
    view,
    yourPlayer,
    opponent,
    selectSpec,
    sendTopCard,
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
                window.location.search = `?join=${encodeURIComponent(session.sessionCode)}`;
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
              window.location.search = `?join=${encodeURIComponent(session.sessionCode)}`;
            }}
          >
            Rejoin With Code
          </button>
        </section>
      </main>
    );
  }

  if (session.status === "lobby") {
    return (
      <main className="app-shell">
        <section className="game-screen">
          <div className="headline-row">
            <h1>Lobby</h1>
            <span className="energy-pill">{session.sessionCode}</span>
          </div>
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
          <div className="request-box">
            <p>
              Invite Code: <strong>{session.sessionCode}</strong>
            </p>
            <p>
              Join Link: <a href={joinUrl}>{joinUrl}</a>
            </p>
            <img
              className="qr-image"
              alt="Join session QR code"
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`}
            />
          </div>
          <div className="request-box">
            <p>Players ({session.players.length}/2)</p>
            {session.players.map((player) => (
              <p key={player.id}>
                {player.name}
                {player.id === session.hostPlayerId ? " (Host)" : ""}
              </p>
            ))}
          </div>
          <button
            type="button"
            className="btn-primary"
            disabled={!isHost || session.players.length !== 2 || state.busy}
            onClick={() => void startGame()}
          >
            {isHost ? "Start Game" : "Waiting For Host"}
          </button>
        </section>
      </main>
    );
  }

  if (session.status === "finished") {
    const winner = session.players.find((player) => player.id === session.winnerPlayerId);
    return (
      <main className="fallback">
        <section className="context-error-card">
          <h2>Game Finished</h2>
          <p>Winner: {winner?.name ?? "Unknown"}</p>
          <button type="button" className="btn-primary" onClick={() => (window.location.search = "")}>
            Back To Landing
          </button>
        </section>
      </main>
    );
  }

  if (!opponent) {
    return <main className="fallback">Waiting for opponent...</main>;
  }

  const selectedByColor =
    session.players.find((player) => player.id === view.selectedByPlayerId)?.color ?? null;

  const selectedSpecEqual = Boolean(
    view.selectedSpecKey &&
      view.yourTopCard &&
      view.opponentTopCard &&
      findSpecValue(view.selectedSpecKey, view.yourTopCard.specs) ===
        findSpecValue(view.selectedSpecKey, view.opponentTopCard.specs)
  );
  const canSwipeSend = !state.busy && Boolean(view.yourTopCard) && !view.pendingTransfer;

  return (
    <main className="app-shell app-shell--gameplay">
      <section className="game-screen game-screen--gameplay">
        <div className="headline-row headline-row--gameplay">
          <h1>Quartett Duel</h1>
          <button type="button" className="icon-button" aria-label="Settings">
            ⚙
          </button>
        </div>

        {showRuntimeWarning ? (
          <div className="runtime-warning" role="alert">
            Realtime is not configured for this environment. This screen is running in local mock mode.
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
            onSwipeUp={() => void sendTopCard()}
          />

          <ActionBar
            currentPlayerId={playerId}
            opponentName={opponent.name}
            hasYourTopCard={Boolean(view.yourTopCard)}
            canStartTie={selectedSpecEqual}
            tieActive={view.tieState.active}
            busy={state.busy}
            pendingTransfer={view.pendingTransfer}
            loseTieRequest={view.loseTieRequest}
            onSendCard={sendTopCard}
            onStartTie={startTie}
            onLoseTie={loseTie}
            onRespondTransfer={respondTransfer}
            onRespondTie={respondTie}
          />

          <div className="tie-info" aria-live="polite">
            <span>Tie Pot Cards: {view.tieState.potCards.length}</span>
            <span>Tie Rounds: {view.tieState.rounds}</span>
          </div>
          <div className="opponent-state">
            <span className="opponent-state__title">{opponent.name}</span>
            <span className="opponent-state__subtitle">Top card hidden</span>
          </div>
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
  const code = params.get("code")?.trim().toUpperCase() ?? "";
  const prefilledCode = joinCode || code;

  if (!sessionId) {
    return <EntryScreen prefilledCode={prefilledCode} joinOnly={Boolean(joinCode)} />;
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

  return <SessionScreen sessionId={sessionId} playerId={playerId} />;
}

export default App;
