import { create } from "zustand";
import type { XPEvent } from "../types/skills";

type XPEventState = {
  events: XPEvent[];
  recordXP: (params: {
    skillId: string;
    amount: number;
    source: XPEvent["source"];
    sourceId: string;
    name?: string;
  }) => void;

  getAll: () => XPEvent[];
  getBySkill: (skillId: string) => XPEvent[];
  clear: () => void;
}

export const useXPEventStore = create<XPEventState>((set, get) => ({
  events: (() => {
    try {
      const raw = localStorage.getItem("xpEvents");
      return raw ? (JSON.parse(raw) as XPEvent[]) : [];
    } catch {
      return [];
    }
  })(),

  recordXP: ({ skillId, amount, source, sourceId, name}) => {
    const timestamp = Date.now();

    const newEvent: XPEvent = {
      id: crypto.randomUUID(),
      skillId,
      amount,
      source,
      sourceId: sourceId ?? "unidentified",
      name,
      timestamp,
    }

    set(state => {
      const next = [newEvent, ...state.events];
      try {
        localStorage.setItem("xpEvents", JSON.stringify(next));
      } catch {}
      return { events: next };
    });
  },

  getAll: () => get().events,
  getBySkill: (skillId) => 
    get().events.filter(e => e.skillId === skillId),
  clear: () => set({ events: [] }),
}))
