import type { Evidence } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { DEFAULT } from "../../constants";

export class EvidenceStore {
  private evidence: Evidence[] = [];

  getAll(): Evidence[] {
    return this.evidence;
  }

  add(verb: string, object: string, timespent: number | undefined, origin: string) {
    const inferredTime = timespent ?? DEFAULT.EFFORT;
    this.evidence.push({
      id: crypto.randomUUID(),
      verb,
      object,
      origin,
      timespent:inferredTime,
      timestamp: Date.now(),
    });
  }

  // weigh(evidence: Evidence) {
  //   let weight = 0.05;
  //   if(evidence.count > 3) weight += 0.03;
  //   if(evidence.totalTime > 300) weight += 0.04;
  //   return clamp(weight, 0.01, 0.15);
  // }


}