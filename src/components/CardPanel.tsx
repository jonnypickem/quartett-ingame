import type { CardView } from "../types/game";

interface CardPanelProps {
  variant: "you" | "opponent";
  playerName: string;
  topCard: CardView | null;
  selectedSpecKey: string | null;
  selectedByColor: string | null;
  onSelectSpec?: (specKey: string) => void;
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
  onSelectSpec
}: CardPanelProps) => {
  const surfaceClass = variant === "you" ? "player-surface--you" : "player-surface--opponent";

  return (
    <section className={`player-surface ${surfaceClass}`}>
      <div className="player-surface__header">
        <span className="player-tag">{variant === "you" ? "YOU" : "OPPONENT"}</span>
        <span className="player-name">{playerName}</span>
      </div>

      {topCard ? (
        <article className="card-shell">
          <div className="card-meta-row">
            <span className="card-id">{topCard.code}</span>
            <span className="card-category">{topCard.category}</span>
          </div>

          <img className="card-image" src={topCard.imageUrl} alt={`${topCard.code} card art`} />

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
