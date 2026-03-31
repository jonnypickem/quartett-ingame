import type { LoseTieRequest, TransferRequest } from "../types/game";

interface ActionBarProps {
  currentPlayerId: string;
  opponentName: string;
  hasYourTopCard: boolean;
  canStartTie: boolean;
  tieActive: boolean;
  busy: boolean;
  pendingTransfer: TransferRequest | null;
  loseTieRequest: LoseTieRequest | null;
  onSendCard: () => Promise<void>;
  onStartTie: () => Promise<void>;
  onLoseTie: () => Promise<void>;
  onRespondTransfer: (status: "accepted" | "declined") => Promise<void>;
  onRespondTie: (status: "accepted" | "declined") => Promise<void>;
}

export const ActionBar = ({
  currentPlayerId,
  opponentName,
  hasYourTopCard,
  canStartTie,
  tieActive,
  busy,
  pendingTransfer,
  loseTieRequest,
  onSendCard,
  onStartTie,
  onLoseTie,
  onRespondTransfer,
  onRespondTie
}: ActionBarProps) => {
  const incomingTransfer = pendingTransfer?.toPlayerId === currentPlayerId ? pendingTransfer : null;
  const outgoingTransfer = pendingTransfer?.fromPlayerId === currentPlayerId ? pendingTransfer : null;

  const tieAwaitingMe = loseTieRequest?.winnerPlayerId === currentPlayerId;
  const tieWaitingOther = loseTieRequest?.loserPlayerId === currentPlayerId;

  return (
    <section className="action-panel">
      <div className="action-panel__buttons">
        <button
          type="button"
          className="btn-primary"
          disabled={busy || !hasYourTopCard || Boolean(pendingTransfer)}
          onClick={() => void onSendCard()}
        >
          Send Card
        </button>

        <button
          type="button"
          className="btn-secondary"
          disabled={busy || !hasYourTopCard || !canStartTie || Boolean(pendingTransfer)}
          onClick={() => void onStartTie()}
        >
          Tie
        </button>

        <button
          type="button"
          className="btn-tertiary"
          disabled={busy || !tieActive || Boolean(loseTieRequest)}
          onClick={() => void onLoseTie()}
        >
          Lost Tie
        </button>
      </div>

      {outgoingTransfer ? (
        <div className="request-box request-box--pending">
          <p>
            You offered card <strong>{outgoingTransfer.cardId}</strong>. Waiting for acceptance.
          </p>
        </div>
      ) : null}

      {incomingTransfer ? (
        <div className="request-box">
          <p>
            {opponentName} wants to send card <strong>{incomingTransfer.cardId}</strong>.
          </p>
          <div className="request-actions">
            <button type="button" className="btn-mini btn-mini--accept" onClick={() => void onRespondTransfer("accepted")}>
              Accept
            </button>
            <button type="button" className="btn-mini btn-mini--decline" onClick={() => void onRespondTransfer("declined")}>
              Decline
            </button>
          </div>
        </div>
      ) : null}

      {tieAwaitingMe ? (
        <div className="request-box">
          <p>Tie resolution requested. Accepting grants the whole tie pot to you.</p>
          <div className="request-actions">
            <button type="button" className="btn-mini btn-mini--accept" onClick={() => void onRespondTie("accepted")}>
              Accept Tie
            </button>
            <button type="button" className="btn-mini btn-mini--decline" onClick={() => void onRespondTie("declined")}>
              Decline Tie
            </button>
          </div>
        </div>
      ) : null}

      {tieWaitingOther ? (
        <div className="request-box request-box--pending">
          <p>Waiting for {opponentName} to confirm your Lost Tie request.</p>
        </div>
      ) : null}
    </section>
  );
};
