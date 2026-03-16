import { describe, it, expect } from "vitest";
import {
  calculateConfidence,
  evaluateReadiness,
} from "../../../utils/skill/analysis/threshold";
import type { Cluster, Candidate } from "../../../types/skills";

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
        readiness: 0,
        origin: [],
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        state: "latent",
      };
      const result = evaluateReadiness(candidate, 0);
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
        readiness: 0,
        origin: ["q1", "q2", "q3"], // MIN_SIZE >= 3 so readiness is not capped
        firstSeenAt: Date.now(),
        lastSeenAt: Date.now(),
        state: "latent",
      };
      const result = evaluateReadiness(candidate, 0);
      expect(result).toBe("ready");
    });
  });

});
