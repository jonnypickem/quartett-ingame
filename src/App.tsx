import { ActionBar } from "./components/ActionBar";
import { CardPanel } from "./components/CardPanel";
import { StatusBar } from "./components/StatusBar";
import { useGameSession } from "./hooks/useGameSession";

const CURRENT_PLAYER_ID = "p1";

const findSpecValue = (specKey: string, cardSpecs: { key: string; value: number }[]) => {
  return cardSpecs.find((spec) => spec.key === specKey)?.value ?? null;
};

function App() {
  const {
    state,
    view,
    yourPlayer,
    opponent,
    selectSpec,
    sendTopCard,
    respondTransfer,
    startTie,
    loseTie,
    respondTie,
    clearError
  } = useGameSession(CURRENT_PLAYER_ID);

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

  return (
    <main className="app-shell">
      <section className="game-screen">
        <div className="headline-row">
          <h1>Quartett Duel</h1>
          <span className="energy-pill">Session {state.session.sessionId.slice(-4).toUpperCase()}</span>
        </div>

        {state.lastError ? (
          <div className="error-banner" role="alert">
            <span>{state.lastError}</span>
            <button type="button" onClick={clearError}>
              Dismiss
            </button>
          </div>
        ) : null}

        <StatusBar yourCount={view.yourCount} opponentCount={view.opponentCount} busy={state.busy} />

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
          currentPlayerId={CURRENT_PLAYER_ID}
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
      </section>
    </main>
  );
}

export default App;
