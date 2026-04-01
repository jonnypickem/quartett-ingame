import { beforeEach, describe, expect, it, vi } from "vitest";
import { copyText, shareOrCopyInvite } from "./share";

describe("share helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("copies via clipboard API when available", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText }
    });

    const copied = await copyText("https://example.com");
    expect(copied).toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://example.com");
  });

  it("falls back to execCommand when clipboard is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: undefined
    });

    const execSpy = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: execSpy
    });

    const copied = await copyText("abc");

    expect(copied).toBe(true);
    expect(execSpy).toHaveBeenCalledWith("copy");
  });

  it("returns share feedback when native share is available", async () => {
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: vi.fn().mockResolvedValue(undefined)
    });

    const feedback = await shareOrCopyInvite("QRT123", "https://example.com/join");
    expect(feedback).toBe("Invite link ready to share.");
  });
});
