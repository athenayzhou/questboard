import { describe, it, expect } from "vitest";
import {
  calculateXP,
  xpToLevel,
  levelToProgress,
} from "../../../utils/skill/analysis/experience";
import { createTestQuest } from "../../../test/utils";
import { LEVELS } from "../../../utils/constants";

describe("skill experience utils", () => {
  describe("calculateXP", () => {
    it("should calculate XP for easy quest", () => {
      const quest = createTestQuest({ difficulty: "easy", duration: 10 });
      const xp = calculateXP(quest);
      expect(xp).toBeGreaterThan(0);
      expect(xp).toBeLessThanOrEqual(50);
    });

    it("should calculate XP for medium quest", () => {
      const quest = createTestQuest({ difficulty: "medium", duration: 15 });
      const xp = calculateXP(quest);
      expect(xp).toBeGreaterThan(0);
    });

    it("should calculate XP for hard quest", () => {
      const quest = createTestQuest({ difficulty: "hard", duration: 45 });
      const xp = calculateXP(quest);
      expect(xp).toBeGreaterThan(0);
    });

    it("should use duration multiplier for short quests", () => {
      const shortQuest = createTestQuest({ difficulty: "medium", duration: 5 });
      const mediumQuest = createTestQuest({ difficulty: "medium", duration: 15 });
      expect(calculateXP(shortQuest)).toBeLessThan(calculateXP(mediumQuest));
    });
  });

  describe("xpToLevel", () => {
    it("should return 1 for 0 xp (LEVELS[0] is 0)", () => {
      expect(xpToLevel(0)).toBe(1);
    });

    it("should return 1 for xp below LEVELS[1]", () => {
      expect(xpToLevel(5)).toBe(1);
    });

    it("should return correct level for xp in LEVELS range", () => {
      expect(xpToLevel(LEVELS[0])).toBe(1);
      expect(xpToLevel(LEVELS[1] - 1)).toBe(1);
      expect(xpToLevel(LEVELS[1])).toBe(2);
    });

    it("should return max level for exceeding highest LEVELS", () => {
      expect(xpToLevel(1000)).toBe(LEVELS.length);
    });
  });

  describe("levelToProgress", () => {
    it("should return progress object with level", () => {
      const result = levelToProgress(50);
      expect(result).toHaveProperty("level");
      expect(result).toHaveProperty("xp");
      expect(result).toHaveProperty("xpMax");
      expect(result).toHaveProperty("progress");
    });

    it("should have progress between 0 and 1 for mid-level", () => {
      const result = levelToProgress(50);
      expect(result.progress).toBeGreaterThanOrEqual(0);
      expect(result.progress).toBeLessThanOrEqual(1);
    });
  });
});
