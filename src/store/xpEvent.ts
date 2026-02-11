import type { XPEvent } from "../types/skills";
import { recomputeSkillLedger, getSkillKeyFromEvent } from "./skillLedger";

export class XPEventStore {
  private events: XPEvent[] = [];

  recordXP(event: Omit<XPEvent, "timestamp">) {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });
    recomputeSkillLedger();
  }

  getAll(): XPEvent[]{
    return [...this.events];
  }

  getBySkill(skillKey:string) {
    return this.events.filter(e => getSkillKeyFromEvent(e) === skillKey);
  }

  clear() {
    this.events = [];
  }
}

export const XPEventStoreInstance = new XPEventStore();