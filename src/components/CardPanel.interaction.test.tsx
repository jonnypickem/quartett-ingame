import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CardPanel, shouldTriggerSwipe } from "./CardPanel";

const topCard = {
  id: "card-1",
  code: "A1",
  category: "Pirate Ships",
  imageUrl: "https://example.com/a1.jpg",
  specs: [
    { key: "speed", label: "Speed", unit: "km/h", value: 50, icon: "jet_speed" },
    { key: "armor", label: "Armor", unit: "mm", value: 40, icon: "default" }
  ]
};

describe("CardPanel gesture interactions", () => {
  it("marks swipe as valid only when threshold is exceeded", () => {
    expect(shouldTriggerSwipe(-96, -100)).toBe(true);
    expect(shouldTriggerSwipe(-20, -721)).toBe(true);
    expect(shouldTriggerSwipe(-70, -320)).toBe(false);
  });

  it("renders a swipeable zone in player mode", () => {
    const { container } = render(
      <CardPanel
        variant="you"
        playerName="You"
        topCard={topCard}
        selectedSpecKey={null}
        selectedByColor={null}
        swipeEnabled
        onSwipeUp={async () => true}
      />
    );

    expect(container.querySelector(".card-stack-zone--swipeable")).not.toBeNull();
  });

  it("falls back to generated image when remote image fails", () => {
    const { container } = render(
      <CardPanel
        variant="you"
        playerName="You"
        topCard={{
          ...topCard,
          imageUrl: "https://example.invalid/missing-image.jpg"
        }}
        selectedSpecKey={null}
        selectedByColor={null}
      />
    );

    const image = container.querySelector(".card-image") as HTMLImageElement;
    expect(image).not.toBeNull();
    fireEvent.error(image);
    expect(image.src).toContain("data:image/svg+xml");
  });
});
