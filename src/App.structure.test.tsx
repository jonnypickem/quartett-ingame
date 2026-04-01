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
  });

  it("renders running view with one visible card panel and hidden opponent details", () => {
    const { container } = render(<App />);

    expect(screen.getByText("Top card hidden")).toBeInTheDocument();
    expect(screen.queryByText("No card available")).not.toBeInTheDocument();
    expect(container.querySelectorAll(".player-surface").length).toBe(1);
  });
});
