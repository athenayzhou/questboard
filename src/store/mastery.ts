import { create } from "zustand";
import type { Mastery } from "../types/skills";
import { useSkillStore } from "./skill";
import { useXPEventStore } from "./xpEvent";
import { getEligibleSkills } from "../utils/skill/generation/grant";
import { generateMasteryName, generateMasteryTitle } from "../utils/skill/generation/name";
import { devLog } from "../dev/devLogs";

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

function normalizeVerb(verb: string | undefined | null) {
  return (verb ?? "").toLowerCase().trim();
}

function skillIdsForVerb(verb: string): string[] {
  const v = normalizeVerb(verb);
  return useSkillStore
    .getState()
    .getAll()
    .filter((s) => normalizeVerb(s.verb) === v)
    .map((s) => s.id);
}

function skillIdSetsEqual(
  a: string[] | undefined | null,
  b: string[] | undefined | null,
): boolean {
  const aa = a ?? [];
  const bb = b ?? [];
  if (aa.length !== bb.length) return false;
  const setA = new Set(aa);
  return bb.every((id) => setA.has(id));
}

type MasteryState = {
  masteries: Mastery[];
  addMastery: (mastery: Mastery) => void;
  grantMastery: () => Mastery[];
  getAll: () => Mastery[];
  getByVerb: (verb?: string | null) => Mastery | undefined;
  /** Recompute `skillIds` for the mastery matching this verb from current skills (e.g. after a new skill is added). */
  syncSkillsForVerb: (verb: string) => void;
  /** Recompute every mastery's `skillIds` from current skills (e.g. after hydrating from server). */
  reconcileAllMasteriesWithSkills: () => void;
  updateMastery: (
    id: string,
    patch: Partial<Pick<Mastery, "name" | "title">>,
  ) => void;
};

export const useMasteryStore = create<MasteryState>((set, get) => ({
  masteries: [],

  addMastery: (mastery) => {
    set((state) => {
      const verbNorm = normalizeVerb(mastery.verb);
      const already = state.masteries.some(
        (m) => normalizeVerb(m.verb) === verbNorm,
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
      const verbNorm = normalizeVerb(verb);
      if (existing.some((m) => normalizeVerb(m.verb) === verbNorm)) continue;

      const verbLabel = (verb ?? "").trim();
      const mastery: Mastery = {
        id: crypto.randomUUID(),
        verb: verbLabel,
        name: generateMasteryName(verbLabel),
        title: generateMasteryTitle(verbLabel),
        earnedAt: Date.now(),
        skillIds: verbSkills.map((s) => s.id),
      };

      get().addMastery(mastery);
      if (!get().masteries.some((m) => m.id === mastery.id)) {
        devLog(
          "mastery",
          `skipped duplicate verb mastery (already have path for "${verbNorm}")`,
        );
        continue;
      }
      devLog("player", `mastery granted: "${mastery.name}"`);
      devLog(
        "mastery",
        `new mastery: "${mastery.name}" for verb: "${mastery.verb}" from skills, ${mastery.skillIds.join(", ")}`,
      );
      devLog("mastery", `mastery earned: "${mastery.name}" (${mastery.verb})`);
      granted.push(mastery);
    }
    return granted;
  },

  getAll: () => get().masteries,

  getByVerb: (verb) => {
    const v = normalizeVerb(verb);
    return get().masteries.find(
      (mastery) => normalizeVerb(mastery.verb) === v,
    );
  },

  syncSkillsForVerb: (verb) => {
    const vNorm = normalizeVerb(verb);
    let changed = false;
    set((state) => {
      const idx = state.masteries.findIndex(
        (m) => normalizeVerb(m.verb) === vNorm,
      );
      if (idx === -1) return state;
      const mastery = state.masteries[idx];
      const nextIds = skillIdsForVerb(mastery.verb);
      if (skillIdSetsEqual(mastery.skillIds, nextIds)) return state;
      changed = true;
      const next = [...state.masteries];
      next[idx] = { ...mastery, skillIds: nextIds };
      return { masteries: next };
    });
    if (changed) touchExtension();
  },

  reconcileAllMasteriesWithSkills: () => {
    let changed = false;
    set((state) => {
      const next = state.masteries.map((m) => {
        const nextIds = skillIdsForVerb(m.verb);
        if (skillIdSetsEqual(m.skillIds, nextIds)) return m;
        changed = true;
        return { ...m, skillIds: nextIds };
      });
      if (!changed) return state;
      return { masteries: next };
    });
    if (changed) touchExtension();
  },

  updateMastery: (id, patch) => {
    set((state) => {
      const idx = state.masteries.findIndex((m) => m.id === id);
      if (idx === -1) return state;
      const prev = state.masteries[idx];
      const nextPatch: Partial<Pick<Mastery, "name" | "title">> = {};
      if (patch.name !== undefined) {
        const n = patch.name.trim();
        if (!n) return state;
        nextPatch.name = n;
      }
      if (patch.title !== undefined) nextPatch.title = patch.title.trim();
      if (Object.keys(nextPatch).length === 0) return state;
      const updated = { ...prev, ...nextPatch };
      if (updated.name === prev.name && updated.title === prev.title) return state;
      const next = [...state.masteries];
      next[idx] = updated;
      touchExtension();
      return { masteries: next };
    });
  },
}));
