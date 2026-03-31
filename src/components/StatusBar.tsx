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
  return (
    <header className="status-row">
      <div className="count-chip count-chip--you">
        <span className="count-chip__label">Your Cards</span>
        <span className="count-chip__value">{yourCount}</span>
      </div>
      <div className="count-chip count-chip--opponent">
        <span className="count-chip__label">Opponent Cards</span>
        <span className="count-chip__value">{opponentCount}</span>
      </div>
      <div className="status-badge" aria-live="polite">
        {getStatusLabel(busy, connectionStatus, runtimeMode)}
      </div>
    </header>
  );
};
