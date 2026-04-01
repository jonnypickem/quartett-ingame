interface StatusBarProps {
  yourCount: number;
  opponentCount: number;
  busy: boolean;
  connectionStatus: "bootstrapping" | "connected" | "degraded" | "error";
  runtimeMode: "realtime" | "local-mock";
}

const getStatusLabel = (
  busy: boolean,
  connectionStatus: "bootstrapping" | "connected" | "degraded" | "error",
  runtimeMode: "realtime" | "local-mock"
) => {
  if (busy || connectionStatus === "bootstrapping") {
    return "Syncing";
  }
  if (connectionStatus === "error") {
    return "Error";
  }
  if (runtimeMode === "local-mock" || connectionStatus === "degraded") {
    return "Local Mock";
  }
  return "Live";
};

export const StatusBar = ({
  yourCount,
  opponentCount,
  busy,
  connectionStatus,
  runtimeMode
}: StatusBarProps) => {
  const statusLabel = getStatusLabel(busy, connectionStatus, runtimeMode);

  return (
    <header className="deck-row">
      <div className="deck-chip deck-chip--you">
        <span className="deck-chip__label">Your Deck</span>
        <span className="count-chip__value">{yourCount}</span>
      </div>
      <div className="versus-slot">
        <span className="versus-pill">Versus</span>
        <span className="live-dot">{statusLabel}</span>
      </div>
      <div className="deck-chip deck-chip--opponent">
        <span className="deck-chip__label">Opponent</span>
        <span className="count-chip__value">{opponentCount}</span>
      </div>
    </header>
  );
};
