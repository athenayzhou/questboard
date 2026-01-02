import type { Evidence } from "../../../types/skills";
import { clamp } from "three/src/math/MathUtils.js";
import { DEFAULT } from "../../constants";

export class EvidenceStore {
  private evidence: Evidence[] = [];

  getAll(): Evidence[] {
    return this.evidence;
  }

  add(props: {
    verb: string,
    object: string,
    origin: string,
    timespent?: number,
  }) {
    const inferredTime = 
      props.timespent ?? 
      DEFAULT.EFFORT;

    this.evidence.push({
      id: crypto.randomUUID(),
      verb: props.verb,
      object: props.object,
      origin: props.origin,
      timespent:inferredTime,
      timestamp: Date.now(),
    });
  }

}