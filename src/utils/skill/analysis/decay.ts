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