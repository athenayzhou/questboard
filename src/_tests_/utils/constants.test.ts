import { describe, it, expect } from "vitest";
import { MS, UI, DIFFICULTY_EFFORT } from "../../utils/constants";

describe('constants', () => {
  describe('MS (time constants)', () => {
    it('should have correct millisecond values', () => {
      expect(MS.SECOND).toBe(1000)
      expect(MS.MINUTE).toBe(60000)
      expect(MS.HOUR).toBe(3600000)
      expect(MS.DAY).toBe(86400000)
    })
  })

  describe('UI constants', () => {
    it('should have drag threshold', () => {
      expect(UI.DRAG_THRESHOLD_PX).toBe(6)
    })
    it('should have spawn boundaries', () => {
      expect(UI.SPAWN_X_MAX).toBe(72)
      expect(UI.SPAWN_Y_MIN).toBe(5)
      expect(UI.SPAWN_Y_MAX).toBe(62)
    })
  })

  describe('DIFFICULTY_EFFORT', () => {
    it('should map difficulties to effort values', () => {
      expect(DIFFICULTY_EFFORT.easy).toBe(5)
      expect(DIFFICULTY_EFFORT.medium).toBe(15)
      expect(DIFFICULTY_EFFORT.hard).toBe(30)
    })
  })
})