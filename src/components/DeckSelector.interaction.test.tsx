import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DeckSelector } from "./DeckSelector";

const decks = [
  {
    id: "military-jets-v1",
    name: "Military Jets",
    description: "Fast jets and strike aircraft.",
    coverImageUrl: "/decks/military-jets-v1/f22.jpg",
    cardCount: 32,
    isHidden: false
  },
  {
    id: "supercars-v1",
    name: "Supercars",
    description: "Performance road beasts.",
    coverImageUrl: "/decks/supercars-v1/aventador.jpg",
    cardCount: 32,
    isHidden: false
  }
];

const makeProps = () => ({
  decks,
  selectedDeckId: null as string | null,
  busy: false,
  errorMessage: null as string | null,
  onSelectDeck: vi.fn(async () => true),
  onResolveDeckById: vi.fn(async () => null),
  onSelectionConfirmed: vi.fn()
});

describe("DeckSelector interactions", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("preselects the first deck and confirms with the bottom CTA", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    render(<DeckSelector {...props} />);

    await user.click(screen.getByRole("button", { name: "Create Lobby" }));

    expect(props.onSelectDeck).toHaveBeenCalledWith("military-jets-v1");
    expect(props.onSelectionConfirmed).toHaveBeenCalledTimes(1);
  });

  it("scrolls to a slide when nav dot is clicked", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    const scrollSpy = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      value: scrollSpy
    });
    render(<DeckSelector {...props} />);

    const [supercarsDot] = screen.getAllByRole("button", { name: "Go to Supercars" });
    await user.click(supercarsDot);

    expect(scrollSpy).toHaveBeenCalled();
  });

  it("shows a clear error hint when deck selection action fails", async () => {
    const user = userEvent.setup();
    const props = makeProps();
    props.onSelectDeck = vi.fn(async () => false);
    render(<DeckSelector {...props} />);

    const [selectButton] = screen.getAllByRole("button", { name: "Create Lobby" });
    await user.click(selectButton);

    expect(await screen.findByText("Could not create lobby from this deck.")).toBeInTheDocument();
  });
});
