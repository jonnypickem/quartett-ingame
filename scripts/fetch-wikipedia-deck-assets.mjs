#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync, rmSync, existsSync, copyFileSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = process.cwd();
const DECK_SOURCE_PATH = path.join(ROOT, "src/data/decks.ts");
const PUBLIC_DECKS_PATH = path.join(ROOT, "public/decks");
const MANIFEST_PATH = path.join(ROOT, "content/decks/content-manifest.json");
const USER_AGENT = "quartett-pro-content-bot/1.0 (+local-dev)";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const normalize = (value) => value.trim().toLowerCase();

const parseDeckSeedsFromSource = () => {
  const source = readFileSync(DECK_SOURCE_PATH, "utf8");
  const deckRegex = /{\s*id:\s*"([^"]+)"[\s\S]*?name:\s*"([^"]+)"[\s\S]*?cards:\s*\[([\s\S]*?)\]\s*}/g;
  const cardRegex = /{\s*name:\s*"([^"]+)"\s*,\s*tier:\s*(\d+)\s*}/g;
  const decks = [];
  let deckMatch;

  while ((deckMatch = deckRegex.exec(source))) {
    const deckId = deckMatch[1];
    const deckName = deckMatch[2];
    const cardsRaw = deckMatch[3];
    const cards = [];
    let cardMatch;

    while ((cardMatch = cardRegex.exec(cardsRaw))) {
      cards.push({
        name: cardMatch[1],
        tier: Number(cardMatch[2])
      });
    }

    decks.push({ id: deckId, name: deckName, cards });
  }

  if (decks.length !== 3) {
    throw new Error(`Expected 3 decks from src/data/decks.ts, received ${decks.length}.`);
  }

  return decks;
};

const getDeckHint = (deckId) => {
  if (deckId === "military-jets-v1") {
    return "fighter aircraft";
  }
  if (deckId === "supercars-v1") {
    return "supercar";
  }
  return "submarine";
};

const buildSearchQueries = (deckId, cardName) => {
  const hint = getDeckHint(deckId);
  const queries = [];
  queries.push(`${cardName} ${hint}`);
  queries.push(cardName);

  if (deckId === "military-submarines-v1" && normalize(cardName).includes("class")) {
    queries.push(`${cardName} submarine class`);
    queries.push(`${cardName} submarine`);
  }

  if (deckId === "military-jets-v1") {
    queries.push(`${cardName} jet`);
  }

  if (deckId === "supercars-v1") {
    queries.push(`${cardName} sports car`);
  }

  return [...new Set(queries.map((entry) => entry.trim()).filter(Boolean))];
};

const wikipediaSearch = async (query) => {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.searchParams.set("action", "query");
  url.searchParams.set("list", "search");
  url.searchParams.set("srsearch", query);
  url.searchParams.set("srlimit", "8");
  url.searchParams.set("format", "json");

  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json"
    }
  });

  if (!response.ok) {
    return [];
  }

  const body = await response.json();
  return Array.isArray(body?.query?.search) ? body.query.search.map((entry) => entry.title).filter(Boolean) : [];
};

const fetchSummary = async (title) => {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const response = await fetch(url, {
    headers: {
      "user-agent": USER_AGENT,
      accept: "application/json"
    }
  });

  if (!response.ok) {
    return null;
  }
  return await response.json();
};

const scoreSummary = (deckId, cardName, title, summary) => {
  const cardNorm = normalize(cardName).replace(/-class/g, "");
  const titleNorm = normalize(title).replace(/-class/g, "");
  const descriptionNorm = normalize(summary?.description ?? "");
  const extractNorm = normalize(summary?.extract ?? "");
  let score = 0;

  if (titleNorm.includes(cardNorm)) {
    score += 8;
  }
  if (cardNorm.includes(titleNorm)) {
    score += 3;
  }
  if (titleNorm.includes("disambiguation")) {
    score -= 10;
  }

  if (deckId === "military-jets-v1") {
    if (descriptionNorm.includes("aircraft") || extractNorm.includes("aircraft")) {
      score += 3;
    }
  } else if (deckId === "supercars-v1") {
    if (descriptionNorm.includes("car") || extractNorm.includes("car")) {
      score += 3;
    }
  } else if (descriptionNorm.includes("submarine") || extractNorm.includes("submarine")) {
    score += 3;
  }

  if (summary?.thumbnail?.source) {
    score += 5;
  }

  return score;
};

const selectBestSummary = async (deckId, cardName, titles) => {
  const scored = [];
  for (const title of titles) {
    const summary = await fetchSummary(title);
    if (!summary) {
      continue;
    }
    scored.push({
      title,
      summary,
      score: scoreSummary(deckId, cardName, title, summary)
    });
    await sleep(60);
  }

  scored.sort((a, b) => b.score - a.score);
  return scored[0] ?? null;
};

const downloadToJpeg = async (sourceUrl, outputPath) => {
  const candidateUrls = [sourceUrl];
  if (sourceUrl.includes("/px-")) {
    candidateUrls.unshift(sourceUrl.replace(/\/\d+px-/, "/960px-"));
  }

  let response = null;
  let imageUrl = "";
  for (const candidate of candidateUrls) {
    const current = await fetch(candidate, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "image/*"
      }
    });
    if (current.ok) {
      response = current;
      imageUrl = candidate;
      break;
    }
  }

  if (!response) {
    throw new Error(`Could not download image: ${sourceUrl}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  const bytes = Buffer.from(await response.arrayBuffer());

  if (contentType.includes("jpeg") || contentType.includes("jpg")) {
    writeFileSync(outputPath, bytes);
    return imageUrl;
  }

  const tmpPath = `${outputPath}.tmp`;
  writeFileSync(tmpPath, bytes);
  const conversion = spawnSync("sips", ["-s", "format", "jpeg", tmpPath, "--out", outputPath], {
    stdio: "ignore"
  });
  rmSync(tmpPath, { force: true });
  if (conversion.status !== 0 || !existsSync(outputPath)) {
    throw new Error(`Could not convert image to JPEG: ${sourceUrl}`);
  }
  return imageUrl;
};

const buildCardCode = (index) => String(index + 1).padStart(2, "0");

const buildFallbackImagePath = (deckId) => path.join(PUBLIC_DECKS_PATH, deckId, "01.svg");

const run = async () => {
  const decks = parseDeckSeedsFromSource();
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: "Wikimedia/Wikipedia",
    notes: [
      "All card images are stored as local JPG files in public/decks/<deck-id>/<code>.jpg.",
      "Deck/categorization data comes from src/data/decks.ts.",
      "Raw stat modeling remains deterministic and normalized in app/backend deck generation."
    ],
    decks: []
  };

  for (const deck of decks) {
    const deckOutputDir = path.join(PUBLIC_DECKS_PATH, deck.id);
    mkdirSync(deckOutputDir, { recursive: true });

    const deckManifest = {
      id: deck.id,
      name: deck.name,
      cards: []
    };

    console.log(`\n[deck] ${deck.name} (${deck.id})`);

    for (let index = 0; index < deck.cards.length; index += 1) {
      const card = deck.cards[index];
      const code = buildCardCode(index);
      const outputPath = path.join(deckOutputDir, `${code}.jpg`);
      const queries = buildSearchQueries(deck.id, card.name);

      let picked = null;
      for (const query of queries) {
        const titles = await wikipediaSearch(query);
        if (titles.length === 0) {
          continue;
        }

        picked = await selectBestSummary(deck.id, card.name, titles.slice(0, 4));
        if (picked?.summary?.thumbnail?.source) {
          break;
        }
      }

      let resolvedTitle = "";
      let wikipediaPageUrl = "";
      let sourceImageUrl = "";
      let downloadedImageUrl = "";

      if (picked?.summary?.thumbnail?.source) {
        resolvedTitle = picked.title;
        wikipediaPageUrl = picked.summary?.content_urls?.desktop?.page ?? "";
        sourceImageUrl = picked.summary.thumbnail.source;

        try {
          downloadedImageUrl = await downloadToJpeg(sourceImageUrl, outputPath);
        } catch (error) {
          console.warn(`  [warn] ${card.name}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      if (!existsSync(outputPath)) {
        const fallbackSvg = buildFallbackImagePath(deck.id);
        const fallbackJpg = path.join(deckOutputDir, "01.jpg");
        if (existsSync(fallbackJpg)) {
          copyFileSync(fallbackJpg, outputPath);
        } else if (existsSync(fallbackSvg)) {
          console.warn(`  [warn] ${card.name}: missing photo source, keeping fallback image slot unresolved.`);
        }
      }

      deckManifest.cards.push({
        code,
        name: card.name,
        tier: card.tier,
        localImageUrl: `/decks/${deck.id}/${code}.jpg`,
        source: {
          queryChain: queries,
          wikipediaTitle: resolvedTitle || null,
          wikipediaPageUrl: wikipediaPageUrl || null,
          thumbnailUrl: sourceImageUrl || null,
          downloadedImageUrl: downloadedImageUrl || null
        }
      });

      const stateLabel = existsSync(outputPath) ? "ok" : "missing";
      console.log(`  [${stateLabel}] ${code} ${card.name}`);
      await sleep(80);
    }

    manifest.decks.push(deckManifest);
  }

  mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
  writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(`\nManifest written: ${MANIFEST_PATH}`);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
