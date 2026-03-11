import type { Candidate, Cluster } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { MS, CLUSTER, CANDIDATE } from "../../constants";

export function calculateConfidence(cluster: Cluster) {
  const recency = Date.now() - cluster.lastSeenAt;
  const recencyFactor = Math.exp(-recency / MS.DAY);
  const volumeFactor = Math.min(cluster.totalTime / CLUSTER.CONFIDENCE_EFFORTDIVISOR, CLUSTER.CONFIDENCE_MAX);
  return clamp(recencyFactor * volumeFactor, 0, 1)
}

export function evaluateReadiness(candidate: Candidate, clusterConfidence: number) : Candidate["state"] {
  const xpScore = candidate.xp / 10;
  const confidenceWeight = 0.5 + 0.5 * clusterConfidence;
  const readiness = xpScore * confidenceWeight

  if (candidate.origin.length < CANDIDATE.MIN_SIZE){
    candidate.readiness = Math.min(readiness, CANDIDATE.EMERGENT_THRESHOLD - 0.1);
  } else {
    candidate.readiness = clamp(readiness, 0, 1);
  }
  

  if (candidate.readiness >= CANDIDATE.EMERGENT_THRESHOLD) return "ready";
  if (candidate.readiness >= CANDIDATE.LATENT_THRESHOLD) return "emergent";
  return "latent";
}