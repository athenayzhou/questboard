import { describe, it, expect } from "vitest";
import {
  shouldDecaySkill,
  calculateSkillDecay,
  checkDormancy,
} from "../../../utils/skill/analysis/decay";
import { createTestSkill } from "../../../test/utils";
import { DECAY, MS } from "../../../utils/constants";

describe("skill decay utils", () => {
  const now = Date.now();

  describe("shouldDecaySkill", () => {
    it("should return true when enough time since last decay", () => {
      const skill = createTestSkill({
        lastDecayAt: now - DECAY.DECAY_CHECK_INTERVAL - 1,
      });
      expect(shouldDecaySkill(skill, now)).toBe(true);
    });

    it("should return false when not enough time since last decay", () => {
      const skill = createTestSkill({
        lastDecayAt: now - DECAY.DECAY_CHECK_INTERVAL + MS.HOUR,
      });
      expect(shouldDecaySkill(skill, now)).toBe(false);
    });
  });

  describe("calculateSkillDecay", () => {
    it("should return 0 when skill was seen recently (within 7 days)", () => {
      const skill = createTestSkill({
        xp: 100,
        lastSeenAt: now - 2 * MS.DAY,
        lastDecayAt: now - 2 * MS.DAY,
      });
      expect(calculateSkillDecay(skill, now)).toBe(0);
    });

    it("should return decay amount for dormant skill seen long ago", () => {
      const skill = createTestSkill({
        xp: 100,
        lastSeenAt: now - 30 * MS.DAY,
        lastDecayAt: now - (DECAY.DECAY_CHECK_INTERVAL + 1),
        isDormant: true,
      });
      const amount = calculateSkillDecay(skill, now);
      expect(amount).toBeGreaterThanOrEqual(0);
      expect(amount).toBeLessThanOrEqual(100);
    });
  });

  describe("checkDormancy", () => {
    it("should return true when skill not seen for dormant threshold days", () => {
      const skill = createTestSkill({
        lastSeenAt: now - (DECAY.DORMANT_THRESHOLD_DAYS + 1) * MS.DAY,
      });
      expect(checkDormancy(skill, now)).toBe(true);
    });

    it("should return false when skill seen recently", () => {
      const skill = createTestSkill({
        lastSeenAt: now - 5 * MS.DAY,
      });
      expect(checkDormancy(skill, now)).toBe(false);
    });
  });
});
