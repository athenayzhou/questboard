import type { Candidate } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { DECAY, MS } from "../../constants";

export function decaySkills(){
  // return skills.map(s => {
  //   const lapsed = now - s.firstSeenAt;
  //   const decayedProficiency = Math.max(0, s.proficiency - lapsed * DECAY.RATE);
  //   return {...s, proficiency: decayedProficiency}
  // });
}

export function decayCandidates(candidate: Candidate, now: number){
  const daysIdle = (now - candidate.lastSeenAt) / MS.DAY;
  const decay = daysIdle * DECAY.PER_DAY;
  candidate.confidence = clamp(candidate.confidence - decay, 0, 1);
  if(candidate.confidence < DECAY.THRESHOLD){
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