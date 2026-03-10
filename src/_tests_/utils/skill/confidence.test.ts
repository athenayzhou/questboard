import { describe, it, expect } from "vitest";
import {
  calculateConfidence,
  evaluateReadiness,
  aura,
} from "../../../utils/skill/analysis/confidence";
import type { Cluster, Candidate } from "../../../types/skills";
import { CONFIDENCE } from "../../../utils/constants";

describe("skill confidence utils", () => {
  describe("calculateConfidence", () => {
    it("should return value between 0 and 1 for cluster", () => {
      const cluster: Cluster = {
        key: "test",
        verb: "test",
        object: "obj",
        count: 1,
        totalTime: 1000,
        xp: 10,
        confidence: 0.5,
        lastSeenAt: Date.now(),
        firstSeenAt: Date.now(),
        origin: [],
      };
      const result = calculateConfidence(cluster);
      expect(result).toBeGreaterThanOrEqual(0);
      expect(result).toBeLessThanOrEqual(1);
    });
  });

  describe("evaluateReadiness", () => {
    it("should return latent for low confidence candidate", () => {
      const candidate: Candidate = {
        id: "test",
        key: "test",
        verb: "test",
        objects: [],
        clusters: [],
        xp: 0,
        confidence: 0,
        origin: [],
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        state: "latent",
      };
      const result = evaluateReadiness(candidate);
      expect(result).toBe("latent");
    });

    it("should return ready for high confidence candidate", () => {
      const candidate: Candidate = {
        id: "test",
        key: "test",
        verb: "test",
        objects: ["a", "b", "c", "d", "e"],
        clusters: [],
        xp: 100,
        confidence: 0,
        origin: [],
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        state: "latent",
      };
      const result = evaluateReadiness(candidate);
      expect(result).toBe("ready");
    });
  });

  describe("aura", () => {
    it("should return none for low confidence", () => {
      expect(aura(0.1)).toBe("none");
    });

    it("should return mist for confidence below growing threshold", () => {
      expect(aura(CONFIDENCE.READY_THRESHOLD + 0.05)).toBe("mist");
    });

    it("should return glow for confidence below strong threshold", () => {
      expect(aura(CONFIDENCE.GROWING_THRESHOLD + 0.05)).toBe("glow");
    });

    it("should return pulse for high confidence", () => {
      expect(aura(CONFIDENCE.STRONG_THRESHOLD + 0.05)).toBe("pulse");
    });
  });
});
