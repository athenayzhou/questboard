import { describe, it, expect } from "vitest";
import { xpEventActivityLabel } from "../../utils/xpEventLabel";
import type { XPEvent } from "../../types/skills";

function ev(p: Partial<XPEvent> & Pick<XPEvent, "id" | "amount" | "source" | "sourceId" | "timestamp">): XPEvent {
  return {
    skillId: "s1",
    ...p,
  } as XPEvent;
}

describe("xpEventActivityLabel", () => {
  it("prefers quest title for quest-sourced XP", () => {
    const e = ev({
      id: "1",
      amount: 10,
      source: "quest",
      sourceId: "q-uuid",
      timestamp: 1,
      name: "dish washing",
      questTitle: "wash dishes",
    });
    expect(xpEventActivityLabel(e)).toBe("wash dishes");
  });

  it("falls back to skill name for quest when no questTitle (legacy)", () => {
    const e = ev({
      id: "1",
      amount: 10,
      source: "quest",
      sourceId: "q-uuid",
      timestamp: 1,
      name: "dish washing",
    });
    expect(xpEventActivityLabel(e)).toBe("dish washing");
  });

  it("uses skill name for decay", () => {
    const e = ev({
      id: "1",
      amount: -5,
      source: "decay",
      sourceId: "idle",
      timestamp: 1,
      name: "dish washing",
    });
    expect(xpEventActivityLabel(e)).toBe("dish washing");
  });
});
