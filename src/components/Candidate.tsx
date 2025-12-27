import type { Candidate } from "../types/skills";
import { calculateConfidence } from "../utils/skill/analysis/confidence";

export function updateCandidate(
  candidate: Candidate,
  evidenceDelta: number,
  now: number,
){
  candidate.evidenceCount += evidenceDelta;
  candidate.confidence = calculateConfidence(candidate.evidenceCount);
  candidate.lastSeenAt = now;
}