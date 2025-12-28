import type { Evidence } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { DEFAULT } from "../../constants";

export class EvidenceStore {
  private map = new Map<string, Evidence>()

  getAll(): Evidence[] {
    return [...this.map.values()];
  }

  weighEvidence(evidence: Evidence){
    let weight = 0.05;
    if (evidence.count > 3) weight += 0.03; 
    if (evidence.totalTime > 300) weight +=0.04
    return clamp(weight, 0.01, 0.15);
  }

  updateEvidence(verb: string, object: string, timespent?: number) {
    const key = `${verb}:${object}`;
    const existing = this.map.get(key);
    const inferredTime = timespent ?? DEFAULT.EFFORT;

    if (existing) {
      existing.count += 1;
      existing.totalTime += inferredTime;
    } else {
      this.map.set(key, {
        id: key,
        verb,
        object,
        count: 1,
        totalTime: inferredTime,
        timestamp: Date.now(),
      });
    }
  }
}
