import type { Evidence, Candidate, Cluster } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { CONFIDENCE } from "../../constants";
import { PROFICIENCY } from "../../constants";

// export function calculateConfidence(count: number) {
//   return 1 - Math.exp(-CONFIDENCE.CURVE_RATE * count);
// }

export function calculateConfidence(cluster: Cluster): number {
  let confidence = 0;
  confidence += cluster.count * 0.1;
  // confidence += Math.min(cluster.totalTime / 300, 0.3);
  confidence += cluster.origin.length * 0.05;
  return Math.min(confidence, 1);
}

// export function calculateProficiency(evidence: Evidence) {
//   const effortScore = evidence.timespent / 60;
//   const repetitionScore = evidence.count;
//   return clamp((effortScore + repetitionScore) / PROFICIENCY.EFFORT_DIVISOR, 0, PROFICIENCY.MAX);
// }

export function evaluateReadiness(candidate: Candidate) : Candidate["state"] {
  return candidate.confidence >= CONFIDENCE.READY_THRESHOLD ? "ready" : "latent";
}

export function aura(confidence: number) {
  if (confidence < CONFIDENCE.READY_THRESHOLD) return "none";
  if (confidence < CONFIDENCE.GROWING_THRESHOLD) return "mist";
  if (confidence < CONFIDENCE.STRONG_THRESHOLD) return "glow";
  return "pulse";
}