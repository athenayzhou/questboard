import type { Evidence, Candidate } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { CONFIDENCE } from "../../constants";
import { PROFICIENCY } from "../../constants";

export function calculateConfidence(evidenceCount: number) {
  return 1 - Math.exp(-CONFIDENCE.CURVE_RATE * evidenceCount);
}

export function calculateProficiency(evidence: Evidence) {
  const effortScore = evidence.totalTime / 60;
  const repetitionScore = evidence.count;
  return clamp((effortScore + repetitionScore) / PROFICIENCY.EFFORT_DIVISOR, 0, PROFICIENCY.MAX);
}

// export function accumulationCurve(){
//   candidate.confidence = clamp(
//     candidate.confidence + evidenceWeight(evidence),
//     0,
//     1
//   )
// }
//should i go with confidence as function of evidencecount or create accumulation curve

export function evaluateReadiness(candidate: Candidate) : Candidate["state"] {
  return candidate.confidence >= CONFIDENCE.READY_THRESHOLD ? "ready" : "latent";
}

export function aura(confidence: number) {
  if (confidence < CONFIDENCE.READY_THRESHOLD) return "none";
  if (confidence < CONFIDENCE.GROWING_THRESHOLD) return "mist";
  if (confidence < CONFIDENCE.STRONG_THRESHOLD) return "glow";
  return "pulse";
}