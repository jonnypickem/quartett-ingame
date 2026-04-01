import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CardPanel } from "./CardPanel";

const topCard = {
  id: "card-1",
  code: "A1",
  category: "Pirate Ships",
  imageUrl: "https://example.com/a1.jpg",
  specs: [
    { key: "speed", label: "Speed", value: 50 },
    { key: "armor", label: "Armor", value: 40 }
  ]
};

describe("CardPanel gesture interactions", () => {
  it("calls onSwipeUp when user swipes upward on card stack", () => {
    const onSwipeUp = vi.fn();
    const { container } = render(
      <CardPanel
        variant="you"
        playerName="You"
        topCard={topCard}
        selectedSpecKey={null}
        selectedByColor={null}
        swipeEnabled
        onSwipeUp={onSwipeUp}
      />
    );

    const swipeZone = container.querySelector(".card-stack-zone--swipeable");
    expect(swipeZone).not.toBeNull();

    fireEvent.touchStart(swipeZone!, {
      changedTouches: [{ clientX: 120, clientY: 250 }]
    });
    fireEvent.touchEnd(swipeZone!, {
      changedTouches: [{ clientX: 122, clientY: 120 }]
    });

    expect(onSwipeUp).toHaveBeenCalledTimes(1);
  });
});
