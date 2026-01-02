import type { XPEvent } from "../../../types/skills";

export class XPEventStore {
  private events: XPEvent[] = [];

  log(event: Omit<XPEvent, "id" | "timestamp">) {
    this.events.push({
      ...event,
      id: crypto.randomUUID(),
      timestamp: Date.now()
    })
  }

  getAll(){
    return [...this.events];
  }

  clear() {
    this.events = [];
  }
}