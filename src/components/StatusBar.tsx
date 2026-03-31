interface StatusBarProps {
  yourCount: number;
  opponentCount: number;
  busy: boolean;
}

export const StatusBar = ({ yourCount, opponentCount, busy }: StatusBarProps) => {
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
        {busy ? "Syncing" : "Live"}
      </div>
    </header>
  );
};
