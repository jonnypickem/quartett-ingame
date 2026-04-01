import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createSessionView } from "./lib/gameEngine";
import { createMockSessionState } from "./state/mockState";
import type { GameUiState } from "./types/game";

const session = createMockSessionState("session-layout");
const playerId = "p1";
session.status = "running";

const uiState: GameUiState = {
  session,
  eventQueue: [],
  busy: false,
  lastError: null,
  lastSeenEventId: 0,
  connectionStatus: "connected",
  runtimeMode: "realtime",
  contextError: null
};

vi.mock("./hooks/useGameSession", () => ({
  useGameSession: () => ({
    state: uiState,
    runtimeMode: "realtime",
    view: createSessionView(session, playerId),
    yourPlayer: session.players.find((player) => player.id === playerId)!,
    opponent: session.players.find((player) => player.id !== playerId)!,
    selectSpec: vi.fn(),
    sendTopCard: vi.fn(),
    selectDeck: vi.fn(),
    startGame: vi.fn(),
    respondTransfer: vi.fn(),
    startTie: vi.fn(),
    loseTie: vi.fn(),
    respondTie: vi.fn(),
    connectionStatus: "connected",
    contextError: null,
    clearError: vi.fn()
  })
}));

import App from "./App";

describe("App in-game structure", () => {
  beforeEach(() => {
    window.history.replaceState({}, "", "/?session=session-layout&player=p1");
    session.status = "running";
    session.deckId = null;
  });

  it("renders running view with one visible card shell and no extra info blocks under action row", () => {
    const { container } = render(<App />);

    expect(screen.queryByText("No card available")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".card-shell--stack").length).toBe(1);
    expect(container.querySelector(".player-surface__header")).toBeNull();
    expect(container.querySelector(".stack-peek__card")).toBeNull();
    expect(container.querySelector(".opponent-state")).toBeNull();
    expect(container.querySelector(".tie-info")).toBeNull();
    expect(container.querySelector(".action-panel__buttons--duel")).not.toBeNull();
    expect(screen.queryByText("Swipe up to send")).not.toBeInTheDocument();
  });

  it("forces deck selector before lobby details when create flow has deck=select", () => {
    session.status = "lobby";
    session.deckId = "supercars-v1";
    window.history.replaceState({}, "", "/?session=session-layout&player=p1&deck=select");

    render(<App />);

    expect(screen.getByText("Choose your deck")).toBeInTheDocument();
    expect(screen.queryByText("Invite Your Opponent")).not.toBeInTheDocument();
  });
});
