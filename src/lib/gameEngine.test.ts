import { describe, expect, it } from "vitest";
import { applyGameAction, createSessionView, GameActionError } from "./gameEngine";
import { cloneSessionState, initialMockState } from "../state/mockState";

describe("gameEngine", () => {
  it("applies spec selection and mirrors selected metadata", () => {
    const state = cloneSessionState(initialMockState);

    const response = applyGameAction(state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: state.version,
      actionType: "SELECT_SPEC",
      payload: { specKey: "range" }
    });

    const view = createSessionView(response.state, "p2");

    expect(response.state.selectedSpecKey).toBe("range");
    expect(response.state.selectedByPlayerId).toBe("p1");
    expect(view.selectedSpecKey).toBe("range");
  });

  it("cycles both top cards to winner bottom on transfer accept", () => {
    const state = cloneSessionState(initialMockState);
    const firstP1 = state.players.find((player) => player.id === "p1")!.hand[0]!;
    const firstP2 = state.players.find((player) => player.id === "p2")!.hand[0]!;
    const nextP1 = state.players.find((player) => player.id === "p1")!.hand[1]!;
    const nextP2 = state.players.find((player) => player.id === "p2")!.hand[1]!;

    const pending = applyGameAction(state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: state.version,
      actionType: "SEND_CARD",
      payload: { cardId: firstP1.id }
    });

    const accepted = applyGameAction(pending.state, {
      sessionId: state.sessionId,
      actorPlayerId: "p2",
      expectedVersion: pending.state.version,
      actionType: "RESPOND_TRANSFER",
      payload: {
        requestId: pending.state.pendingTransfer!.id,
        status: "accepted"
      }
    });

    const p1 = accepted.state.players.find((player) => player.id === "p1")!;
    const p2 = accepted.state.players.find((player) => player.id === "p2")!;

    expect(p1.hand[0].id).toBe(nextP1.id);
    expect(p2.hand[0].id).toBe(nextP2.id);
    expect(p2.hand[p2.hand.length - 2].id).toBe(firstP2.id);
    expect(p2.hand[p2.hand.length - 1].id).toBe(firstP1.id);
  });

  it("keeps cards unchanged when transfer declined", () => {
    const state = cloneSessionState(initialMockState);
    const firstP1 = state.players.find((player) => player.id === "p1")!.hand[0]!;
    const firstP2 = state.players.find((player) => player.id === "p2")!.hand[0]!;

    const pending = applyGameAction(state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: state.version,
      actionType: "SEND_CARD",
      payload: { cardId: firstP1.id }
    });

    const declined = applyGameAction(pending.state, {
      sessionId: state.sessionId,
      actorPlayerId: "p2",
      expectedVersion: pending.state.version,
      actionType: "RESPOND_TRANSFER",
      payload: {
        requestId: pending.state.pendingTransfer!.id,
        status: "declined"
      }
    });

    const p1 = declined.state.players.find((player) => player.id === "p1")!;
    const p2 = declined.state.players.find((player) => player.id === "p2")!;

    expect(p1.hand[0].id).toBe(firstP1.id);
    expect(p2.hand[0].id).toBe(firstP2.id);
  });

  it("resolves tie pot and awards cards plus loser top card", () => {
    const state = cloneSessionState(initialMockState);
    const firstP1 = state.players.find((player) => player.id === "p1")!.hand[0]!;
    const firstP2 = state.players.find((player) => player.id === "p2")!.hand[0]!;
    const secondP1 = state.players.find((player) => player.id === "p1")!.hand[1]!;

    const tieStarted = applyGameAction(state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: state.version,
      actionType: "START_TIE",
      payload: { reason: "spec_equal" }
    });

    const loseTie = applyGameAction(tieStarted.state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: tieStarted.state.version,
      actionType: "LOSE_TIE",
      payload: { winnerPlayerId: "p2" }
    });

    const resolved = applyGameAction(loseTie.state, {
      sessionId: state.sessionId,
      actorPlayerId: "p2",
      expectedVersion: loseTie.state.version,
      actionType: "RESPOND_TIE",
      payload: {
        requestId: loseTie.state.loseTieRequest!.id,
        status: "accepted"
      }
    });

    const p2 = resolved.state.players.find((player) => player.id === "p2")!;

    expect(resolved.state.tieState.active).toBe(false);
    expect(resolved.state.tieState.potCards.length).toBe(0);
    expect(p2.hand.map((card) => card.id)).toContain(firstP1.id);
    expect(p2.hand.map((card) => card.id)).toContain(firstP2.id);
    expect(p2.hand.map((card) => card.id)).toContain(secondP1.id);
  });

  it("keeps tie active and pot frozen when lost tie is declined", () => {
    const state = cloneSessionState(initialMockState);

    const tieStarted = applyGameAction(state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: state.version,
      actionType: "START_TIE",
      payload: { reason: "spec_equal" }
    });

    const loseTie = applyGameAction(tieStarted.state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: tieStarted.state.version,
      actionType: "LOSE_TIE",
      payload: { winnerPlayerId: "p2" }
    });

    const declined = applyGameAction(loseTie.state, {
      sessionId: state.sessionId,
      actorPlayerId: "p2",
      expectedVersion: loseTie.state.version,
      actionType: "RESPOND_TIE",
      payload: {
        requestId: loseTie.state.loseTieRequest!.id,
        status: "declined"
      }
    });

    expect(declined.state.tieState.active).toBe(true);
    expect(declined.state.tieState.potCards.length).toBe(2);
    expect(declined.state.loseTieRequest).toBeNull();
  });

  it("rejects stale action version", () => {
    const state = cloneSessionState(initialMockState);

    expect(() =>
      applyGameAction(state, {
        sessionId: state.sessionId,
        actorPlayerId: "p1",
        expectedVersion: state.version + 1,
        actionType: "SELECT_SPEC",
        payload: { specKey: "speed" }
      })
    ).toThrow(GameActionError);
  });

  it("rejects duplicate send while pending transfer exists", () => {
    const state = cloneSessionState(initialMockState);
    const firstP1 = state.players.find((player) => player.id === "p1")!.hand[0]!;
    const secondP1 = state.players.find((player) => player.id === "p1")!.hand[1]!;

    const first = applyGameAction(state, {
      sessionId: state.sessionId,
      actorPlayerId: "p1",
      expectedVersion: state.version,
      actionType: "SEND_CARD",
      payload: { cardId: firstP1.id }
    });

    expect(() =>
      applyGameAction(first.state, {
        sessionId: state.sessionId,
        actorPlayerId: "p1",
        expectedVersion: first.state.version,
        actionType: "SEND_CARD",
        payload: { cardId: secondP1.id }
      })
    ).toThrow(GameActionError);
  });

  it("allows only host to select deck in lobby", () => {
    const lobbyState = cloneSessionState(initialMockState);
    lobbyState.status = "lobby";
    lobbyState.players = lobbyState.players.map((player) => ({ ...player, hand: [] }));
    lobbyState.deckId = null;

    expect(() =>
      applyGameAction(lobbyState, {
        sessionId: lobbyState.sessionId,
        actorPlayerId: "p2",
        expectedVersion: lobbyState.version,
        actionType: "SELECT_DECK",
        payload: { deckId: "supercars-v1" }
      })
    ).toThrow(GameActionError);

    const selected = applyGameAction(lobbyState, {
      sessionId: lobbyState.sessionId,
      actorPlayerId: "p1",
      expectedVersion: lobbyState.version,
      actionType: "SELECT_DECK",
      payload: { deckId: "supercars-v1" }
    });

    expect(selected.state.deckId).toBe("supercars-v1");
  });

  it("requires deck selection before starting from lobby", () => {
    const lobbyState = cloneSessionState(initialMockState);
    lobbyState.status = "lobby";
    lobbyState.players = lobbyState.players.map((player) => ({ ...player, hand: [] }));
    lobbyState.deckId = null;

    expect(() =>
      applyGameAction(lobbyState, {
        sessionId: lobbyState.sessionId,
        actorPlayerId: "p1",
        expectedVersion: lobbyState.version,
        actionType: "START_GAME",
        payload: {}
      })
    ).toThrow(GameActionError);
  });
});
