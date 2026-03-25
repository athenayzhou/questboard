import { describe, it, expect, beforeEach, vi } from "vitest";
import { useSkillStore } from "../../store/skill";
import { createTestSkill, resetAllStores } from "../../test/utils";

vi.mock("../../store/xpEvent", () => ({
  useXPEventStore: {
    getState: () => ({
      recordXP: vi.fn(),
      getAll: () => [],
    }),
  },
}));

describe("skill store", () => {
  beforeEach(() => {
    resetAllStores();
    useSkillStore.setState({ skills: {} });
  });

  it("should add skill", () => {
    const skill = createTestSkill({ id: "s1", name: "Test Skill" });
    useSkillStore.getState().addSkill(skill);
    expect(useSkillStore.getState().getById("s1")).toEqual(skill);
    expect(useSkillStore.getState().getAll()).toHaveLength(1);
  });

  it("should get skill by id and by key", () => {
    const skill = createTestSkill({ id: "s1", key: "test-skill" });
    useSkillStore.getState().addSkill(skill);
    expect(useSkillStore.getState().getById("s1")).toBeDefined();
    expect(useSkillStore.getState().getByKey("test-skill")).toBeDefined();
  });

  it("should decay XP", () => {
    const skill = createTestSkill({ id: "s1", xp: 100 });
    useSkillStore.getState().addSkill(skill);
    useSkillStore.getState().decayXP("s1", 20);
    expect(useSkillStore.getState().getById("s1")?.xp).toBe(80);
  });

  it("should not decay below 0", () => {
    const skill = createTestSkill({ id: "s1", xp: 10 });
    useSkillStore.getState().addSkill(skill);
    useSkillStore.getState().decayXP("s1", 50);
    expect(useSkillStore.getState().getById("s1")?.xp).toBe(0);
  });

  it("should awaken dormant skill", () => {
    const skill = createTestSkill({ id: "s1", isDormant: true });
    useSkillStore.getState().addSkill(skill);
    useSkillStore.getState().awakenDormantSkill("s1");
    expect(useSkillStore.getState().getById("s1")?.isDormant).toBe(false);
  });

  it("should not change non-dormant skill when awakening", () => {
    const skill = createTestSkill({ id: "s1", isDormant: false });
    useSkillStore.getState().addSkill(skill);
    useSkillStore.getState().awakenDormantSkill("s1");
    expect(useSkillStore.getState().getById("s1")?.isDormant).toBe(false);
  });
});
