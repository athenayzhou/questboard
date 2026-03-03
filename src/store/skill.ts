import { create } from "zustand";
import type { Skill } from "../types/skills";
import { useXPEventStore } from "./xpEvent";

type SkillState = {
  skills: Record<string, Skill>;
  addSkill: (skill: Skill) => void;
  gainXP: (id: string, amount: number, questId?: string) => void;
  _applyXP: (id: string, amount: number) => void;
  getAll: () => Skill[];
  getById: (id: string) => Skill | undefined;
  getByKey: (key: string) => Skill | undefined;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: {},

  addSkill: (skill) =>
    set((state) => ({ skills: {...state.skills, [skill.id]: skill} })),

  gainXP: (id, amount, questId) => {
    const skill = get().skills[id];
    if(!skill) return;

    const updated: Skill = {
      ...skill,
      xp: skill.xp + amount,
      confidence: Math.min(1, skill.confidence + 0.05),
      lastSeenAt: Date.now(),
    };

    useXPEventStore.getState().recordXP({
      skillId: id,
      amount,
      source: "quest",
      sourceId: questId ?? "unidentified",
      name: skill.name,
    });
    set((state) => ({ skills: { ...state.skills, [id]: updated } }));
  },

  _applyXP: (id, amount) => {
    set(state => {
      const skill = state.skills[id];
      if(!skill) return state;
      const updated: Skill = {
        ...skill,
        xp: skill.xp + amount,
        confidence: Math.min(1, skill.confidence + 0.05),
        lastSeenAt: Date.now(),
      };
      return{
        skills: {
          ...state.skills,
          [id]: updated,
        }
      };
    });
  },

  getAll: () => Object.values(get().skills),
  getById: (id) => get().skills[id],
  getByKey: (key: string) =>
    Object.values(get().skills).find(skill => skill.key === key),

})) 