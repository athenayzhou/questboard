import type { Evidence, Candidate } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";

const READY_THRESHOLD = 0.05;
const GROWING_THRESHOLD = 0.75;
const STRONG_THRESHOLD = 0.85;

export function calculateConfidence(evidenceCount: number) {
  return 1 - Math.exp(-0.12 * evidenceCount);
}

export function calculateProficiency(evidence: Evidence) {
  const effortScore = evidence.totalTime / 60;
  const repetitionScore = evidence.count;
  return clamp((effortScore + repetitionScore) / 20, 0, 1);
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
  return candidate.confidence >= READY_THRESHOLD ? "ready" : "latent";
}


function triggerNaming(
  candidate: Candidate, 
  uiState: {modalOpen: boolean}, 
  now: number){
  return(
    candidate.state === "latent" &&
    candidate.confidence >= READY_THRESHOLD &&
    !uiState.modalOpen &&
    !recentlyDismissed(candidate, now)
  )
}
function recentlyDismissed(candidate: Candidate, now: number){
  return candidate.dismissedUntil !== undefined &&
  candidate.dismissedUntil > now;
}

export function aura(confidence: number) {
  if (confidence < READY_THRESHOLD) return "none";
  if (confidence < GROWING_THRESHOLD) return "mist";
  if (confidence < STRONG_THRESHOLD) return "glow";
  return "pulse";
}