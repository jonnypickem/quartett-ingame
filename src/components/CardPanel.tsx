import { useMemo, useState } from "react";
import { motion, useAnimationControls } from "framer-motion";
import type { CardView } from "../types/game";

interface CardPanelProps {
  variant: "you" | "opponent";
  playerName: string;
  topCard: CardView | null;
  selectedSpecKey: string | null;
  selectedByColor: string | null;
  onSelectSpec?: (specKey: string) => void;
  swipeEnabled?: boolean;
  onSwipeUp?: () => Promise<boolean>;
  receiveFlightKey?: number;
}

export const shouldTriggerSwipe = (offsetY: number, velocityY: number): boolean =>
  offsetY < -95 || velocityY < -720;

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
  onSwipeUp,
  receiveFlightKey
}: CardPanelProps) => {
  const surfaceClass = variant === "you" ? "player-surface--you" : "player-surface--opponent";
  const controls = useAnimationControls();
  const [swipeState, setSwipeState] = useState<"idle" | "flying" | "rollback">("idle");
  const [inFlight, setInFlight] = useState(false);

  const swipeLabel = useMemo(() => {
    if (swipeState === "rollback") {
      return "Swipe failed. Try again.";
    }
    if (swipeState === "flying") {
      return "Sending...";
    }
    return "Swipe Up To Send";
  }, [swipeState]);

  const canSwipeSurface = variant === "you" && swipeEnabled && Boolean(onSwipeUp);

  return (
    <motion.section
      className={`player-surface ${surfaceClass} ${canSwipeSurface ? "player-surface--swipeable" : ""}`}
      drag={canSwipeSurface && !inFlight ? "y" : false}
      dragElastic={0.12}
      dragConstraints={{ top: -320, bottom: 0 }}
      animate={controls}
      onDragEnd={async (_event, info) => {
        if (!canSwipeSurface || !onSwipeUp || inFlight) {
          return;
        }
        if (!shouldTriggerSwipe(info.offset.y, info.velocity.y)) {
          await controls.start({
            y: 0,
            rotate: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 300, damping: 26 }
          });
          return;
        }

        setInFlight(true);
        setSwipeState("flying");
        await controls.start({
          y: -window.innerHeight,
          rotate: -8,
          opacity: 0.08,
          transition: { duration: 0.28, ease: "easeIn" }
        });

        const succeeded = await onSwipeUp();

        if (!succeeded) {
          setSwipeState("rollback");
          await controls.start({
            y: 0,
            rotate: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 260, damping: 24 }
          });
        }

        if (succeeded) {
          controls.set({ y: 0, rotate: 0, opacity: 1 });
          setSwipeState("idle");
        }

        setInFlight(false);
      }}
    >
      <div className="player-surface__header">
        <span className="player-tag">{variant === "you" ? "YOU" : "OPPONENT"}</span>
        <span className="player-name">{playerName}</span>
      </div>

      {topCard ? (
        <article className="card-shell card-shell--stack">
          <div className={`stack-peek ${canSwipeSurface ? "stack-peek--swipeable" : ""}`} aria-hidden="true">
            <div className="stack-peek__card stack-peek__card--one" />
            <div className="stack-peek__card stack-peek__card--two" />
          </div>

          <div
            className={`card-stack-zone ${swipeEnabled ? "card-stack-zone--swipeable" : ""}`}
          >
            <div className="card-meta-row">
              <span className="card-id">{topCard.code}</span>
              <span className="card-category">{topCard.category}</span>
            </div>

            <img className="card-image" src={topCard.imageUrl} alt={`${topCard.code} card art`} />

            {swipeEnabled ? <div className="swipe-hint">{swipeLabel}</div> : null}
          </div>

          {receiveFlightKey ? (
            <motion.div
              key={receiveFlightKey}
              className="receive-flight"
              initial={{ x: 8, y: 120, rotate: -18, opacity: 0 }}
              animate={{ x: -110, y: -240, rotate: 18, opacity: [0, 1, 0.2] }}
              transition={{ duration: 0.65, ease: "easeOut" }}
            />
          ) : null}

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
    </motion.section>
  );
};
