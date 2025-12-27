import type { Candidate, SkillNode } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";

const DECAY_RATE = 0.001;
const DAY = 1000 * 60 * 60 * 24;

export function decaySkills(skills: SkillNode[], now: number){

  return skills.map(s => {
    const age = now - s.discoveredAt;
    const decayedProficiency = Math.max(0, s.proficiency - age * DECAY_RATE);
    return {...s, proficiency: decayedProficiency}
  });
}

export function decayCandidates(candidate: Candidate, now: number){
  const daysIdle = (now - candidate.lastSeenAt) / DAY;
  const decay = daysIdle * 0.01;
  candidate.confidence = clamp(candidate.confidence - decay, 0, 1);
  if(candidate.confidence < 0.15){
    candidate.state = "decayed";
  }
}

// export function decayTransitions(now: number, halfLifeMs = 1000 * 60 * 60 * 24 * 7){
//   for (const [k, t] of transitions) {
//     const age = now-t.lastSeen;
//     const decay = Math.exp(-age / halfLifeMs);
//     t.weight *= decay;

//     if(t.weight < 0.05) {
//       transitions.delete(k);
//     };
//   }
// }