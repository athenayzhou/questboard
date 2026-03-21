import { describe, it, expect, beforeEach, vi } from "vitest";
import { useMasteryStore } from "../../store/mastery";
import { useSkillStore } from "../../store/skill";
import { createTestSkill, resetAllStores } from "../../test/utils";

vi.mock("@/lib/apiExtension", () => ({
  scheduleExtensionSync: vi.fn(),
}));

describe("mastery store", () => {
  beforeEach(() => {
    resetAllStores();
    useSkillStore.setState({ skills: {} });
    useMasteryStore.setState({ masteries: [] });
  });

  it("syncSkillsForVerb updates skillIds from current skills", () => {
    useMasteryStore.setState({
      masteries: [
        {
          id: "m1",
          verb: "run",
          name: "Runner",
          title: "t",
          earnedAt: 1,
          skillIds: ["s1"],
        },
      ],
    });
    useSkillStore.setState({
      skills: {
        s1: createTestSkill({ id: "s1", verb: "run", key: "k1" }),
        s2: createTestSkill({ id: "s2", verb: "run", key: "k2" }),
      },
    });
    useMasteryStore.getState().syncSkillsForVerb("run");
    const m = useMasteryStore.getState().getAll()[0];
    expect(m.skillIds).toHaveLength(2);
    expect(new Set(m.skillIds)).toEqual(new Set(["s1", "s2"]));
  });

  it("addSkill triggers sync so new skill joins mastery for same verb", async () => {
    useMasteryStore.setState({
      masteries: [
        {
          id: "m1",
          verb: "run",
          name: "Runner",
          title: "t",
          earnedAt: 1,
          skillIds: ["s1"],
        },
      ],
    });
    useSkillStore.setState({
      skills: {
        s1: createTestSkill({ id: "s1", verb: "run", key: "k1" }),
      },
    });
    const s2 = createTestSkill({ id: "s2", verb: "run", key: "k2" });
    useSkillStore.getState().addSkill(s2);
    await vi.waitFor(() => {
      const m = useMasteryStore.getState().getAll()[0];
      expect(m.skillIds).toContain("s2");
    });
  });

  it("getByVerb does not throw when verb is undefined", () => {
    expect(useMasteryStore.getState().getByVerb(undefined)).toBeUndefined();
  });

  it("updateMastery changes name and title", () => {
    useMasteryStore.setState({
      masteries: [
        {
          id: "m1",
          verb: "run",
          name: "Old",
          title: "old title",
          earnedAt: 1,
          skillIds: [],
        },
      ],
    });
    useMasteryStore.getState().updateMastery("m1", {
      name: "New",
      title: "new title",
    });
    const m = useMasteryStore.getState().getByVerb("run");
    expect(m?.name).toBe("New");
    expect(m?.title).toBe("new title");
  });
});
