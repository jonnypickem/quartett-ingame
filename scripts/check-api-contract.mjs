const DEFAULT_SESSION_ID = "11111111-1111-1111-1111-111111111111";
const DEFAULT_PLAYER_ID = "p1";

const endpoint = (process.env.VITE_GAME_ACTION_ENDPOINT || process.env.GAME_ACTION_ENDPOINT || "").trim();
const sessionId = (process.env.CONTRACT_SESSION_ID || DEFAULT_SESSION_ID).trim();
const playerId = (process.env.CONTRACT_PLAYER_ID || DEFAULT_PLAYER_ID).trim();

if (!endpoint) {
  throw new Error(
    "Missing endpoint. Set VITE_GAME_ACTION_ENDPOINT (or GAME_ACTION_ENDPOINT) before running contract check."
  );
}

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const readJson = async (response, label) => {
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch (error) {
    throw new Error(`${label} did not return valid JSON. Body: ${text}`);
  }
  return json;
};

const validateBootstrap = (json) => {
  assert(json && typeof json === "object", "GET bootstrap response must be an object.");
  assert(json.state && typeof json.state === "object", "GET response missing 'state'.");
  assert(Number.isInteger(json.latestEventId), "GET response missing integer 'latestEventId'.");
  assert(typeof json.state.sessionId === "string", "GET response state missing sessionId.");
  assert(Array.isArray(json.state.players), "GET response state missing players array.");
  assert(typeof json.state.version === "number", "GET response state missing version.");
};

const validatePost = (json) => {
  assert(json && typeof json === "object", "POST response must be an object.");
  assert(json.state && typeof json.state === "object", "POST response missing 'state'.");
  assert(Array.isArray(json.events), "POST response missing 'events' array.");
  assert(Number.isInteger(json.appliedVersion), "POST response missing integer 'appliedVersion'.");
  assert(Number.isInteger(json.latestEventId), "POST response missing integer 'latestEventId'.");
  assert(
    json.appliedVersion === json.state.version,
    "POST response mismatch: appliedVersion must equal state.version."
  );
};

const run = async () => {
  const getUrl = new URL(endpoint);
  getUrl.searchParams.set("session", sessionId);

  const getResponse = await fetch(getUrl.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json"
    }
  });

  if (!getResponse.ok) {
    const body = await getResponse.text();
    throw new Error(`GET contract call failed (${getResponse.status}): ${body}`);
  }

  const bootstrap = await readJson(getResponse, "GET bootstrap");
  validateBootstrap(bootstrap);

  const actor = bootstrap.state.players.find((entry) => entry.id === playerId);
  assert(actor, `Player '${playerId}' is not present in seeded session.`);
  const topCard = actor.hand?.[0];
  assert(topCard, `Player '${playerId}' has no top card.`);
  const specKey = topCard.specs?.[0]?.key;
  assert(typeof specKey === "string" && specKey.length > 0, "Could not determine spec key for POST contract test.");

  const postPayload = {
    sessionId,
    actorPlayerId: playerId,
    expectedVersion: bootstrap.state.version,
    actionType: "SELECT_SPEC",
    payload: {
      specKey
    }
  };

  const postResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(postPayload)
  });

  if (!postResponse.ok) {
    const body = await postResponse.text();
    throw new Error(`POST contract call failed (${postResponse.status}): ${body}`);
  }

  const postJson = await readJson(postResponse, "POST action");
  validatePost(postJson);

  console.log("Contract check passed.");
  console.log(`Session: ${sessionId}`);
  console.log(`Applied version: ${postJson.appliedVersion}`);
  console.log(`Latest event ID: ${postJson.latestEventId}`);
};

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
