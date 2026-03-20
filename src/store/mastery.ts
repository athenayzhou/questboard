import { create } from "zustand";
import type { Mastery } from "../types/skills";
import { useSkillStore } from "./skill";
import { useXPEventStore } from "./xpEvent";
import { getEligibleSkills } from "../utils/skill/generation/grant";
import { generateMasteryName, generateMasteryTitle } from "../utils/skill/generation/name";
import { usePlayerStore } from "./player";
import { devLog } from "../dev/devLogs";

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

type MasteryState = {
  masteries: Mastery[];
  addMastery: (mastery: Mastery) => void;
  grantMastery: () => Mastery[];
  getAll: () => Mastery[];
  getByVerb: (verb: string) => Mastery | undefined;
};

export const useMasteryStore = create<MasteryState>((set, get) => ({
  masteries: [],

  addMastery: (mastery) => {
    set((state) => {
      const verbNorm = mastery.verb.toLowerCase().trim();
      const already = state.masteries.some(
        (m) => m.verb.toLowerCase().trim() === verbNorm,
      );
      if (already) return state;

      const next = [...state.masteries, mastery];
      touchExtension();
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
      devLog(
        "mastery",
        `new mastery: "${mastery.name}" for verb: "${mastery.verb}" from skills, ${mastery.skillIds.join(", ")}`,
      );
      devLog(
        "mastery",
        `new title gained from mastery (${mastery.name}), "${mastery.title}"`,
      );
      granted.push(mastery);
    }
    return granted;
  },

  getAll: () => get().masteries,

  getByVerb: (verb) => {
    const v = verb?.toLowerCase().trim();
    return get().masteries.find((mastery) => mastery.verb.toLowerCase().trim() === v);
  },
}));
