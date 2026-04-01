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
  const canSendNow = !busy && hasYourTopCard && !pendingTransfer;

  const tieAwaitingMe = loseTieRequest?.winnerPlayerId === currentPlayerId;
  const tieWaitingOther = loseTieRequest?.loserPlayerId === currentPlayerId;
  const tieBlocked = Boolean(pendingTransfer);
  const tieActiveWithoutRequest = tieActive && !loseTieRequest;

  let tieLabel = "Tie";
  let tieDisabled = busy || !hasYourTopCard || !canStartTie || tieBlocked;
  let tieAction: (() => void) | null = () => void onStartTie();

  if (tieActiveWithoutRequest) {
    tieLabel = "Lost Tie";
    tieDisabled = busy || tieBlocked;
    tieAction = () => void onLoseTie();
  }

  if (tieAwaitingMe) {
    tieLabel = "Accept Tie";
    tieDisabled = busy;
    tieAction = () => void onRespondTie("accepted");
  }

  if (tieWaitingOther) {
    tieLabel = "Tie Pending";
    tieDisabled = true;
    tieAction = null;
  }

  return (
    <section className="action-panel">
      <div className="action-panel__buttons action-panel__buttons--duel">
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
          className="btn-secondary btn-secondary--tie-slot"
          disabled={tieDisabled}
          onClick={tieAction ?? undefined}
        >
          {tieLabel}
        </button>
      </div>

      {canSendNow ? <p className="swipe-caption">Tip: swipe your top card up to send.</p> : null}

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
          <p>Tie resolution requested. Use “Accept Tie” to take the pot, or decline below.</p>
          <div className="request-actions">
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
