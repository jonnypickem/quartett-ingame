import { type ReactNode, useEffect, useState } from "react";
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
  overlayContent?: ReactNode;
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

const iconPathById: Record<string, string> = {
  jet_speed: "M3 13h8l4 4h3l-3-4h4v-2h-4l3-4h-3l-4 4H3z",
  radar: "M4 12a8 8 0 0 1 16 0h-2a6 6 0 0 0-12 0zm4 0a4 4 0 0 1 8 0h-2a2 2 0 0 0-4 0zm4 2a1.6 1.6 0 1 0 0 3.2A1.6 1.6 0 0 0 12 14z",
  range: "M4 12h16M12 4v16M7 7l10 10M17 7 7 17",
  payload: "M4 8h16v3H4zm2 5h12v7H6z",
  altitude: "M12 4 7 10h3v6h4v-6h3z",
  climb_rate: "M6 16h12M8 14l4-6 4 6",
  top_speed: "M4 14a8 8 0 1 1 16 0h-2a6 6 0 1 0-12 0zm8-1 5-3",
  acceleration: "M4 15h4l2-3 3 5 2-3h5",
  power: "M13 3 6 13h5l-1 8 7-10h-5z",
  torque: "M5 12a7 7 0 1 0 7-7v3l4-4-4-4v3a10 10 0 1 1-10 10z",
  weight: "M6 9h12l-1 10H7zm3-3h6l1 3H8z",
  braking: "M6 6h12v6H6zm2 8h8v4H8z",
  torpedo: "M4 12h10l3-2v4l-3-2H4z",
  depth: "M12 3v14m0 0-3-3m3 3 3-3M6 21h12",
  submarine_speed: "M3 13h10l2-2 6 1v2l-6 1-2-2H3z",
  endurance: "M12 6v6l4 2M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18z",
  crew: "M8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4m8 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4M4 19a4 4 0 0 1 8 0m4 0a4 4 0 0 1 8 0",
  displacement: "M3 15h18l-2 4H5zm3-5h12l2 5H4z",
  default: "M12 4a8 8 0 1 1 0 16 8 8 0 0 1 0-16z"
};

const formatNumber = (value: number, precision: number | undefined): string => {
  const safeValue = Number.isFinite(value) ? value : 0;
  const absValue = Math.abs(safeValue);
  if (absValue >= 1_000_000) {
    const scaled = safeValue / 1_000_000;
    const rounded = Math.abs(scaled) >= 10 ? scaled.toFixed(0) : scaled.toFixed(1);
    return `${rounded.replace(/\.0$/, "")} Mio`;
  }
  if (absValue >= 1_000) {
    const scaled = safeValue / 1_000;
    const rounded = Math.abs(scaled) >= 10 ? scaled.toFixed(0) : scaled.toFixed(1);
    return `${rounded.replace(/\.0$/, "")}k`;
  }
  if (typeof precision === "number" && precision > 0) {
    return safeValue.toFixed(precision).replace(/\.?0+$/, "");
  }
  return Math.round(safeValue).toString();
};

const formatUnit = (unit: string): string => {
  if (unit === "people") {
    return "ppl";
  }
  if (unit === "torpedos") {
    return "torp";
  }
  return unit;
};

const SpecIcon = ({ iconId }: { iconId: string }) => {
  const path = iconPathById[iconId] ?? iconPathById.default;
  return (
    <svg className="spec-row__icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
};

const buildFallbackImage = (code: string, category: string): string => {
  const safeCode = code.replace(/[<>&"]/g, "");
  const safeCategory = category.replace(/[<>&"]/g, "");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="900" height="600" viewBox="0 0 900 600">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#112240"/>
          <stop offset="100%" stop-color="#1f6feb"/>
        </linearGradient>
      </defs>
      <rect width="900" height="600" rx="40" fill="url(#g)"/>
      <rect x="32" y="32" width="836" height="536" rx="28" fill="none" stroke="#ffffff55" stroke-width="8"/>
      <text x="70" y="120" fill="#ffffff" font-size="88" font-weight="800" font-family="Nunito, sans-serif">${safeCode}</text>
      <text x="70" y="190" fill="#dbeafe" font-size="44" font-weight="700" font-family="Nunito, sans-serif">${safeCategory}</text>
      <text x="70" y="520" fill="#bfdbfe" font-size="30" font-weight="700" font-family="Nunito, sans-serif">Image unavailable</text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
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
  receiveFlightKey,
  overlayContent
}: CardPanelProps) => {
  const controls = useAnimationControls();
  const [inFlight, setInFlight] = useState(false);
  const [resolvedImageSrc, setResolvedImageSrc] = useState(topCard?.imageUrl ?? "");
  const specs = Array.isArray(topCard?.specs) ? topCard.specs : [];

  const canSwipeSurface = variant === "you" && swipeEnabled && Boolean(onSwipeUp);
  const rootClassName = topCard ? "card-shell card-shell--stack" : "card-shell card-shell--empty";

  useEffect(() => {
    if (!topCard) {
      setResolvedImageSrc("");
      return;
    }
    setResolvedImageSrc(topCard.imageUrl || buildFallbackImage(topCard.code, topCard.category));
  }, [topCard]);

  return (
    <motion.section
      className={`${rootClassName} ${canSwipeSurface ? "card-panel--swipeable" : ""}`}
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
        await controls.start({
          y: -window.innerHeight,
          rotate: -8,
          opacity: 0.08,
          transition: { duration: 0.28, ease: "easeIn" }
        });

        const succeeded = await onSwipeUp();

        if (!succeeded) {
          await controls.start({
            y: 0,
            rotate: 0,
            opacity: 1,
            transition: { type: "spring", stiffness: 260, damping: 24 }
          });
        }

        if (succeeded) {
          controls.set({ y: 0, rotate: 0, opacity: 1 });
        }

        setInFlight(false);
      }}
    >
      {topCard ? (
        <>
          <div className={`card-stack-zone ${swipeEnabled ? "card-stack-zone--swipeable" : ""}`}>
            <div className="card-meta-row">
              <span className="card-id">{topCard.code}</span>
              <span className="card-category">{topCard.category}</span>
            </div>

            <img
              className="card-image"
              src={resolvedImageSrc}
              alt={`${topCard.code} card art`}
              onError={() => {
                const fallback = buildFallbackImage(topCard.code, topCard.category);
                if (resolvedImageSrc !== fallback) {
                  setResolvedImageSrc(fallback);
                }
              }}
            />

            {overlayContent ? <div className="card-stack-overlay">{overlayContent}</div> : null}
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

          <div className="spec-grid" aria-label="Card specs">
            {specs.length === 0 ? <p className="spec-empty">Specs are not available for this card yet.</p> : null}
            {specs.map((spec) => {
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
                  aria-pressed={selected}
                  onClick={() => onSelectSpec?.(spec.key)}
                  disabled={!onSelectSpec}
                >
                  <div className="spec-row__topline">
                    <SpecIcon iconId={spec.icon} />
                    <div className="spec-row__meta">
                      <span className="spec-row__label">{spec.label}</span>
                      <span className="spec-row__caption">{spec.caption ?? spec.unit}</span>
                    </div>
                  </div>
                  <span className="spec-row__value">
                    <span className="spec-row__value-main">{formatNumber(spec.value, spec.displayPrecision)}</span>
                    <span className="spec-row__value-unit">{formatUnit(spec.unit)}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </>
      ) : (
        <p>No card available</p>
      )}
    </motion.section>
  );
};
