import type { Evidence } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";

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

  updateEvidence(verb: string, object: string, timespent: number) {
    const key = `${verb}:${object}`;
    const existing = this.map.get(key);

    if (existing) {
      existing.count += 1;
      existing.totalTime += timespent;
    } else {
      this.map.set(key, {
        id: key,
        verb,
        object,
        count: 1,
        totalTime: timespent,
        timestamp: Date.now(),
      });
    }
  }
}
