import { useMemo } from "react";
import { ActionBar } from "./components/ActionBar";
import { CardPanel } from "./components/CardPanel";
import { StatusBar } from "./components/StatusBar";
import { buildPerspectiveUrl, parseSessionRouteContext } from "./lib/routeContext";
import { useGameSession } from "./hooks/useGameSession";

const findSpecValue = (specKey: string, cardSpecs: { key: string; value: number }[]) => {
  return cardSpecs.find((spec) => spec.key === specKey)?.value ?? null;
};

const InvalidContext = ({ title, message }: { title: string; message: string }) => {
  return (
    <main className="fallback">
      <section className="context-error-card">
        <h2>{title}</h2>
        <p>{message}</p>
        <p className="context-error-card__hint">
          Example: <code>?session=demo-session-01&player=p1</code>
        </p>
      </section>
    </main>
  );
};

function App() {
  const routeContext = useMemo(() => parseSessionRouteContext(window.location.search), []);
  if (!routeContext.ok) {
    return <InvalidContext title="Invalid URL Context" message={routeContext.message} />;
  }

  const { sessionId, playerId } = routeContext.context;

  const {
    state,
    runtimeMode,
    view,
    yourPlayer,
    opponent,
    selectSpec,
    sendTopCard,
    respondTransfer,
    startTie,
    loseTie,
    respondTie,
    connectionStatus,
    contextError,
    clearError
  } = useGameSession(sessionId, playerId);

  if (contextError) {
    return <InvalidContext title="Player Context Error" message={contextError.message} />;
  }

  if (!yourPlayer || !opponent) {
    return <main className="fallback">Unable to load players.</main>;
  }

  const selectedByColor =
    state.session.players.find((player) => player.id === view.selectedByPlayerId)?.color ?? null;

  const selectedSpecEqual = Boolean(
    view.selectedSpecKey &&
      view.yourTopCard &&
      view.opponentTopCard &&
      findSpecValue(view.selectedSpecKey, view.yourTopCard.specs) ===
        findSpecValue(view.selectedSpecKey, view.opponentTopCard.specs)
  );

  const showRuntimeWarning = !import.meta.env.DEV && runtimeMode === "local-mock";

  return (
    <main className="app-shell">
      <section className="game-screen">
        <div className="headline-row">
          <h1>Quartett Duel</h1>
          <span className="energy-pill">Session {state.session.sessionId.slice(-4).toUpperCase()}</span>
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

        <div className="cards-layout">
          <CardPanel
            variant="you"
            playerName={yourPlayer.name}
            topCard={view.yourTopCard}
            selectedSpecKey={view.selectedSpecKey}
            selectedByColor={selectedByColor}
            onSelectSpec={selectSpec}
          />

          <CardPanel
            variant="opponent"
            playerName={opponent.name}
            topCard={view.opponentTopCard}
            selectedSpecKey={view.selectedSpecKey}
            selectedByColor={selectedByColor}
          />
        </div>

        <div className="tie-info" aria-live="polite">
          <span>Tie Pot Cards: {view.tieState.potCards.length}</span>
          <span>Tie Rounds: {view.tieState.rounds}</span>
        </div>

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

        <div className="qa-links">
          <a href={buildPerspectiveUrl(state.session.sessionId, yourPlayer.id)} target="_blank" rel="noreferrer">
            Open {yourPlayer.name} View
          </a>
          <a href={buildPerspectiveUrl(state.session.sessionId, opponent.id)} target="_blank" rel="noreferrer">
            Open {opponent.name} View
          </a>
        </div>
      </section>
    </main>
  );
}

export default App;
