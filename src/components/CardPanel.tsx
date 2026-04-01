import { useRef, type TouchEvent } from "react";
import type { CardView } from "../types/game";

interface CardPanelProps {
  variant: "you" | "opponent";
  playerName: string;
  topCard: CardView | null;
  selectedSpecKey: string | null;
  selectedByColor: string | null;
  onSelectSpec?: (specKey: string) => void;
  swipeEnabled?: boolean;
  onSwipeUp?: () => void;
}

const tintFromHex = (hex: string, alpha: number) => {
  const clean = hex.replace("#", "");
  const value = Number.parseInt(clean, 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const CardPanel = ({
  variant,
  playerName,
  topCard,
  selectedSpecKey,
  selectedByColor,
  onSelectSpec,
  swipeEnabled = false,
  onSwipeUp
}: CardPanelProps) => {
  const surfaceClass = variant === "you" ? "player-surface--you" : "player-surface--opponent";
  const swipeStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (event: TouchEvent<HTMLElement>) => {
    if (!swipeEnabled || !onSwipeUp) {
      return;
    }
    const touch = event.changedTouches[0];
    swipeStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (event: TouchEvent<HTMLElement>) => {
    if (!swipeEnabled || !onSwipeUp) {
      return;
    }
    const start = swipeStartRef.current;
    swipeStartRef.current = null;
    if (!start) {
      return;
    }

    const touch = event.changedTouches[0];
    const deltaY = touch.clientY - start.y;
    const deltaX = touch.clientX - start.x;
    const isSwipeUp = deltaY < -90 && Math.abs(deltaX) < 80;

    if (isSwipeUp) {
      onSwipeUp();
    }
  };

  return (
    <section className={`player-surface ${surfaceClass}`}>
      <div className="player-surface__header">
        <span className="player-tag">{variant === "you" ? "YOU" : "OPPONENT"}</span>
        <span className="player-name">{playerName}</span>
      </div>

      {topCard ? (
        <article className="card-shell card-shell--stack">
          <div
            className={`card-stack-zone ${swipeEnabled ? "card-stack-zone--swipeable" : ""}`}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div className="card-meta-row">
              <span className="card-id">{topCard.code}</span>
              <span className="card-category">{topCard.category}</span>
            </div>

            <img className="card-image" src={topCard.imageUrl} alt={`${topCard.code} card art`} />

            {swipeEnabled ? <div className="swipe-hint">Swipe Up To Send</div> : null}
          </div>

          <div className="spec-grid">
            {topCard.specs.map((spec) => {
              const selected = selectedSpecKey === spec.key;
              const style =
                selected && selectedByColor
                  ? {
                      borderColor: selectedByColor,
                      backgroundColor: tintFromHex(selectedByColor, 0.22)
                    }
                  : undefined;

              return (
                <button
                  key={spec.key}
                  type="button"
                  className={`spec-row ${selected ? "spec-row--selected" : ""}`}
                  style={style}
                  onClick={() => onSelectSpec?.(spec.key)}
                  disabled={!onSelectSpec}
                >
                  <span className="spec-row__label">{spec.label}</span>
                  <span className="spec-row__value">{spec.value}</span>
                </button>
              );
            })}
          </div>
        </article>
      ) : (
        <article className="card-shell card-shell--empty">
          <p>No card available</p>
        </article>
      )}
    </section>
  );
};
