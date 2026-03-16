import { create } from "zustand";
import type { Mastery } from "../types/skills";
import { useSkillStore } from "./skill";
import { useXPEventStore } from "./xpEvent";
import { getEligibleSkills } from "../utils/skill/generation/grant";
import { generateMasteryName, generateMasteryTitle } from "../utils/skill/generation/name";
import { usePlayerStore } from "./player";
import { devLog } from "../dev/devLogs";

type MasteryState = {
  masteries: Mastery[];
  addMastery: (mastery: Mastery) => void;
  grantMastery: () => Mastery[];
  getAll: () => Mastery[];
  getByVerb: (verb: string) => Mastery | undefined;
};

const STORAGE_KEY = "masteries";

export const useMasteryStore = create<MasteryState>((set, get) => ({
  masteries: (() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Mastery[]):[];
    } catch {
      return [];
    }
  })(),

  addMastery: (mastery) => {
    set((state) => {
      const verbNorm = mastery.verb.toLowerCase().trim();
      const already = state.masteries.some(
        (mastery) => mastery.verb.toLowerCase().trim() === verbNorm
      );
      if (already) return state;

      const next = [...state.masteries, mastery];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore storage errors
      }
      return { masteries: next };
    });
  },

  grantMastery: () => {
    const skills = useSkillStore.getState().getAll();
    const events = useXPEventStore.getState().getAll();
    const existing = get().masteries;
    const eligible = getEligibleSkills(skills, events, existing);

    const granted: Mastery[] = [];
    for (const { verb, skills: verbSkills } of eligible) {
      const verbNorm = verb.toLowerCase().trim();
      if (existing.some((m) => m.verb.toLowerCase().trim() === verbNorm)) continue;

      const mastery: Mastery = {
        id: crypto.randomUUID(),
        verb: verb.trim(),
        name: generateMasteryName(verb),
        title: generateMasteryTitle(verb),
        earnedAt: Date.now(),
        skillIds: verbSkills.map((s) => s.id),
      };

      get().addMastery(mastery);
      usePlayerStore.getState().unlockTitle(mastery.title);
      devLog("player", `mastery granted: "${mastery.name}"`);
      devLog("mastery", `new mastery: "${mastery.name}" for verb: "${mastery.verb}" from skills, ${mastery.skillIds.join(", ")}`);
      devLog("mastery", `new title gained from mastery (${mastery.name}), "${mastery.title}"`);
      granted.push(mastery);
    }
    return granted;
  },

  getAll: () => get().masteries,

  getByVerb: (verb) => {
    const v = verb?.toLowerCase().trim();
    return get().masteries.find((mastery) => mastery.verb.toLowerCase().trim() === v);
  },

}))