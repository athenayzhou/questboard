import { create } from "zustand";
import { useSkillStore } from "./skill";
import { promote } from "../utils/skill/generation/promote";
import { devLog } from "../dev/devLogs";
import { candidateStore } from "./bundledStores";
import type { Candidate } from "../types/skills";

function touchExtension() {
  void import("@/lib/apiExtension").then((m) => m.scheduleExtensionSync());
}

export type PendingSkill = {
  id: string;
  candidate: Candidate;
  xp: number;
  questId: string;
  discoveredAt: number;
};

type NameState = {
  isNaming: boolean;
  pendingNaming: Array<{ candidate: any; xp: number; questId: string }>;
  currentNameIndex: number;
  showPrompt: (skills: Array<{ candidate: any; xp: number, questId: string }>) => void;
  completeNaming: (name: string) => void;
  skipNaming: () => void;
  closePrompt: () => void;

  pendingSkills: PendingSkill[];
  addPendingSkill: (skill: Omit<PendingSkill, 'id'|'discoveredAt'>) =>void;
  removePendingSkill: (id: string) => void;
  promotePendingSkill: (id: string, name: string) => void;
};



export const useNameStore = create<NameState>((set, get) => ({
  isNaming: false,
  pendingNaming: [],
  currentNameIndex: 0,

  showPrompt: (candidates) => {
    set({
      isNaming: true,
      pendingNaming: candidates,
      currentNameIndex: 0
    });
  },

  completeNaming: (name) => {
    const { pendingNaming, currentNameIndex } = get();
    const currentItem = pendingNaming[currentNameIndex];

    if(currentItem) {
      promote(currentItem.candidate, name, candidateStore);
      const skill = useSkillStore.getState().getByKey(currentItem.candidate.key);
      if (skill) {
        useSkillStore.getState().gainXP(skill.id, currentItem.xp, currentItem.questId);
      }
      devLog('skill', 'user named skill created', {
        name,
        key: currentItem.candidate.key,
        xp: currentItem.xp
      });
    }
    const nextIndex = currentNameIndex + 1;
    if(nextIndex < pendingNaming.length){
      set({ currentNameIndex: nextIndex });
    } else {
      set({ isNaming: false, pendingNaming: [], currentNameIndex: 0 });
  }},

  skipNaming: () => {
    try {
      const { pendingNaming, currentNameIndex } = get();
      const currentItem = pendingNaming[currentNameIndex];
      const nextIndex = currentNameIndex + 1;
      const isLast = nextIndex >= pendingNaming.length;

      set((state) => {
        const prevPending = state.pendingSkills ?? [];
        let nextPendingSkills = prevPending;

        if (currentItem) {
          const existingIndex = prevPending.findIndex(
            (s) => s.candidate.key === currentItem.candidate.key
          );
          if (existingIndex >= 0) {
            const existing = prevPending[existingIndex];
            const merged = {
              ...existing,
              xp: existing.xp + currentItem.xp,
              candidate: {
                ...existing.candidate,
                origin: [
                  ...new Set([
                    ...(existing.candidate.origin ?? []),
                    ...(currentItem.candidate.origin ?? []),
                  ]),
                ],
              },
            };
            nextPendingSkills = prevPending.map((s, i) =>
              i === existingIndex ? merged : s
            );
          } else {
            nextPendingSkills = [
              ...prevPending,
              {
                id: crypto.randomUUID(),
                candidate: currentItem.candidate,
                xp: currentItem.xp,
                questId: currentItem.questId,
                discoveredAt: Date.now(),
              },
            ];
          }
        }

        if (nextPendingSkills !== prevPending) {
          touchExtension();
        }

        return {
          pendingSkills: nextPendingSkills,
          ...(isLast
            ? { isNaming: false, pendingNaming: [], currentNameIndex: 0 }
            : { currentNameIndex: nextIndex }),
        };
      });
    } catch {
      set({ isNaming: false, pendingNaming: [], currentNameIndex: 0 });
    }
  },

  closePrompt: () => {
    set({ isNaming: false, pendingNaming: [], currentNameIndex: 0 });
  },

  pendingSkills: [],

  addPendingSkill: (skillData) => {
    const pendingSkill: PendingSkill = {
      ...skillData,
      id: crypto.randomUUID(),
      discoveredAt: Date.now(),
    };
    set((state) => {
      const next = [...state.pendingSkills, pendingSkill];
      touchExtension();
      return { pendingSkills: next };
    });
  },

  removePendingSkill: (id) => {
    set((state) => {
      const next = state.pendingSkills.filter((s) => s.id !== id);
      touchExtension();
      return { pendingSkills: next };
    });
  },

  promotePendingSkill: (id, name) => {
    const { pendingSkills } = get();
    const pendingSkill = pendingSkills.find(s => s.id === id);
    if(pendingSkill){
      promote(pendingSkill.candidate, name, candidateStore);
      const skill = useSkillStore.getState().getByKey(pendingSkill.candidate.key);
      if(skill){
        useSkillStore.getState().gainXP(skill.id, pendingSkill.xp, pendingSkill.questId);
      }
      get().removePendingSkill(id);
    }
  }

}));
