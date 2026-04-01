interface ActionBarProps {
  canSend: boolean;
  tieLabel: string;
  tieDisabled: boolean;
  busy: boolean;
  onSendCard: () => Promise<boolean>;
  onTieAction: () => Promise<unknown>;
}

export const ActionBar = ({
  canSend,
  tieLabel,
  tieDisabled,
  busy,
  onSendCard,
  onTieAction
}: ActionBarProps) => {
  return (
    <section className="action-panel">
      <div className="action-panel__buttons action-panel__buttons--duel">
        <button type="button" className="btn-primary" disabled={!canSend || busy} onClick={() => void onSendCard()}>
          Send Card
        </button>

        <button
          type="button"
          className="btn-secondary btn-secondary--tie-slot"
          disabled={tieDisabled || busy}
          onClick={() => void onTieAction()}
        >
          {tieLabel}
        </button>
      </div>
      <p className="action-panel__hint">Choose your strongest stat, then send your top card.</p>
    </section>
  );
};
