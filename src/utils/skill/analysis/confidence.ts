import type { Candidate, Cluster } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { DEFAULT, CONFIDENCE, PROFICIENCY } from "../../constants";

export function calculateConfidence(cluster: Cluster){
  const recency = Date.now() - cluster.lastSeenAt;
  const recencyFactor = Math.exp(-recency / DEFAULT.DAY);
  const volumeFactor = Math.min(cluster.totalTime / PROFICIENCY.EFFORT_DIVISOR, PROFICIENCY.MAX);
  return clamp(recencyFactor * volumeFactor, 0, 1)
}

export function evaluateReadiness(candidate: Candidate) : Candidate["state"] {
  const xpScore = candidate.xp / 10;
  const objectScore = candidate.objects.length * 0.2;
  candidate.confidence = clamp(xpScore + objectScore, 0, 1);

  if (candidate.confidence >= CONFIDENCE.READY_THRESHOLD) return "ready";
  if (candidate.confidence >= CONFIDENCE.EMERGENT_THRESHOLD) return "emergent";
  return "latent";
}

export function aura(confidence: number) {
  if (confidence < CONFIDENCE.READY_THRESHOLD) return "none";
  if (confidence < CONFIDENCE.GROWING_THRESHOLD) return "mist";
  if (confidence < CONFIDENCE.STRONG_THRESHOLD) return "glow";
  return "pulse";
}