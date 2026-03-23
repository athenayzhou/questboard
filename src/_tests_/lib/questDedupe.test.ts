import { describe, it, expect } from "vitest";
import { dedupeQuestsById } from "@/lib/questDedupe";
import { createTestQuest } from "@/test/utils";

describe("dedupeQuestsById", () => {
  it("returns same reference when no duplicate ids", () => {
    const a = createTestQuest({ id: "a" });
    const b = createTestQuest({ id: "b" });
    const list = [a, b];
    expect(dedupeQuestsById(list)).toBe(list);
  });

  it("keeps last quest per id", () => {
    const first = createTestQuest({ id: "x", title: "first" });
    const second = createTestQuest({ id: "x", title: "second" });
    const out = dedupeQuestsById([first, second]);
    expect(out).toHaveLength(1);
    expect(out[0]!.title).toBe("second");
  });
});
