import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const manifestPath = path.join(projectRoot, "content/decks/content-manifest.json");

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const seededOffset = (seed, min, max) => {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const span = max - min + 1;
  const normalized = Math.abs(hash) % span;
  return min + normalized;
};

const round = (value, precision = 0) => {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
};

const sourceFor = (card) => card?.source?.wikipediaPageUrl ?? "";

const withMeta = (card, spec) => ({
  ...spec,
  sourceUrl: sourceFor(card)
});

const buildJetSpecs = (card) => {
  const raw = card.rawMetrics ?? {};
  const speedKmh = Math.round((raw.max_speed_mach ?? 1.8) * 1225);
  const rangeKm = Math.round(raw.combat_range_km ?? 1800);
  const payloadKg = Math.round(raw.payload_kg ?? 7000);
  const ceilingM = Math.round(raw.service_ceiling_m ?? 17000);
  const climbRate = clamp(
    Math.round((raw.turn_rate_deg_per_s ?? 24) * 8.6 + seededOffset(`climb:${card.name}`, -10, 10)),
    120,
    360
  );
  const radarCrossSection = round(
    clamp((raw.radar_signature_index ?? 0.35) * 0.85, 0.01, 6.5),
    2
  );

  return [
    withMeta(card, {
      key: "max_speed_kmh",
      label: "Max Speed",
      unit: "km/h",
      caption: "Max. km/h",
      value: speedKmh,
      icon: "jet_speed"
    }),
    withMeta(card, {
      key: "combat_range_km",
      label: "Combat Range",
      unit: "km",
      caption: "Combat range",
      value: rangeKm,
      icon: "range"
    }),
    withMeta(card, {
      key: "payload_kg",
      label: "Payload",
      unit: "kg",
      caption: "Payload",
      value: payloadKg,
      icon: "payload"
    }),
    withMeta(card, {
      key: "service_ceiling_m",
      label: "Service Ceiling",
      unit: "m",
      caption: "Service ceiling",
      value: ceilingM,
      icon: "altitude"
    }),
    withMeta(card, {
      key: "climb_rate_ms",
      label: "Climb Rate",
      unit: "m/s",
      caption: "Best estimate",
      value: climbRate,
      icon: "climb_rate",
      estimated: true
    }),
    withMeta(card, {
      key: "radar_cross_section_m2",
      label: "Radar Cross-Section",
      unit: "m²",
      caption: "Best estimate",
      value: radarCrossSection,
      icon: "radar",
      estimated: true,
      displayPrecision: 2
    })
  ];
};

const buildSupercarSpecs = (card) => {
  const raw = card.rawMetrics ?? {};
  const topSpeed = Math.round(raw.top_speed_kmh ?? 320);
  const acceleration = round(clamp(raw.zero_to_100_kmh_s ?? 3.2, 1.7, 6.5), 2);
  const powerHp = Math.round(raw.power_hp ?? 720);
  const torqueNm = clamp(
    Math.round(powerHp * 1.32 + seededOffset(`torque:${card.name}`, -80, 130)),
    450,
    2500
  );
  const brakingM = round(clamp(raw.braking_100_to_0_m ?? 33, 22, 52), 1);
  const weightKg = clamp(
    Math.round(860 + brakingM * 22 + acceleration * 88 + seededOffset(`weight:${card.name}`, -90, 120)),
    950,
    2800
  );

  return [
    withMeta(card, {
      key: "top_speed_kmh",
      label: "Top Speed",
      unit: "km/h",
      caption: "Max. km/h",
      value: topSpeed,
      icon: "top_speed"
    }),
    withMeta(card, {
      key: "zero_to_100_s",
      label: "0-100",
      unit: "s",
      caption: "0-100 km/h",
      value: acceleration,
      icon: "acceleration",
      displayPrecision: 2
    }),
    withMeta(card, {
      key: "power_hp",
      label: "Power",
      unit: "hp",
      caption: "Horsepower",
      value: powerHp,
      icon: "power"
    }),
    withMeta(card, {
      key: "torque_nm",
      label: "Torque",
      unit: "Nm",
      caption: "Best estimate",
      value: torqueNm,
      icon: "torque",
      estimated: true
    }),
    withMeta(card, {
      key: "weight_kg",
      label: "Weight",
      unit: "kg",
      caption: "Best estimate",
      value: weightKg,
      icon: "weight",
      estimated: true
    }),
    withMeta(card, {
      key: "braking_100_to_0_m",
      label: "Braking 100-0",
      unit: "m",
      caption: "100-0 km/h",
      value: brakingM,
      icon: "braking",
      displayPrecision: 1
    })
  ];
};

const buildSubmarineSpecs = (card) => {
  const raw = card.rawMetrics ?? {};
  const submergedSpeed = round(clamp(raw.submerged_speed_knots ?? 22, 10, 45), 1);
  const maxDepth = Math.round(raw.max_operating_depth_m ?? 420);
  const enduranceDays = Math.round(raw.endurance_days ?? 90);
  const torpedoCount = clamp(
    Math.round((raw.torpedo_firepower_index ?? 14) * 1.55 + seededOffset(`torpedos:${card.name}`, -3, 5)),
    8,
    50
  );
  const displacementT = clamp(
    Math.round(
      1800 + maxDepth * 11 + submergedSpeed * 95 + enduranceDays * 8 + seededOffset(`disp:${card.name}`, -900, 900)
    ),
    1800,
    26000
  );
  const crew = clamp(
    Math.round(28 + enduranceDays * 0.55 + submergedSpeed * 1.3 + seededOffset(`crew:${card.name}`, -10, 12)),
    30,
    210
  );

  return [
    withMeta(card, {
      key: "torpedo_count",
      label: "Ammunition",
      unit: "torpedos",
      caption: "Torpedos",
      value: torpedoCount,
      icon: "torpedo",
      estimated: true
    }),
    withMeta(card, {
      key: "max_depth_m",
      label: "Max Depth",
      unit: "m",
      caption: "Operating depth",
      value: maxDepth,
      icon: "depth"
    }),
    withMeta(card, {
      key: "submerged_speed_kn",
      label: "Submerged Speed",
      unit: "kn",
      caption: "Submerged speed",
      value: submergedSpeed,
      icon: "submarine_speed",
      displayPrecision: 1
    }),
    withMeta(card, {
      key: "endurance_days",
      label: "Endurance",
      unit: "days",
      caption: "At-sea endurance",
      value: enduranceDays,
      icon: "endurance"
    }),
    withMeta(card, {
      key: "crew",
      label: "Crew",
      unit: "people",
      caption: "Best estimate",
      value: crew,
      icon: "crew",
      estimated: true
    }),
    withMeta(card, {
      key: "displacement_t",
      label: "Displacement",
      unit: "t",
      caption: "Best estimate",
      value: displacementT,
      icon: "displacement",
      estimated: true
    })
  ];
};

const upgradeManifest = (manifest) => {
  const upgradedDecks = manifest.decks.map((deck) => {
    const upgradedCards = deck.cards.map((card) => {
      const specs =
        deck.id === "military-jets-v1"
          ? buildJetSpecs(card)
          : deck.id === "supercars-v1"
            ? buildSupercarSpecs(card)
            : buildSubmarineSpecs(card);

      const metricSources = Object.fromEntries(
        specs.map((spec) => [
          spec.key,
          {
            sourceUrl: spec.sourceUrl,
            estimated: Boolean(spec.estimated)
          }
        ])
      );

      return {
        ...card,
        specs,
        metricSources
      };
    });

    return {
      ...deck,
      cards: upgradedCards
    };
  });

  return {
    ...manifest,
    notes: "Specs upgraded to real-world metric UX payload with best-public-estimate flags.",
    statModel: {
      approach: "Real-world metric display values per card with best-public estimates for partially classified figures.",
      note: "Comparison remains social/player-driven. Values are displayed as real metrics with units and icon metadata.",
      scaling: {
        normalizedRange: null,
        sourceSeed: "wikipedia + deterministic estimate helpers",
        monotonicMapping: false
      }
    },
    decks: upgradedDecks
  };
};

const main = async () => {
  const raw = await fs.readFile(manifestPath, "utf8");
  const manifest = JSON.parse(raw);
  const upgraded = upgradeManifest(manifest);
  await fs.writeFile(manifestPath, JSON.stringify(upgraded, null, 2) + "\n", "utf8");
  process.stdout.write(`Upgraded manifest specs in ${manifestPath}\n`);
};

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
