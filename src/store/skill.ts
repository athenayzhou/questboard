import { create } from "zustand";
import type { Skill } from "../types/skills";
import { useXPEventStore } from "./xpEvent";
import { DECAY } from "../utils/constants";
import { calculateSkillDecay, checkDormancy, shouldDecaySkill } from "../utils/skill/analysis/decay";

type SkillState = {
  skills: Record<string, Skill>;
  addSkill: (skill: Skill) => void;
  gainXP: (id: string, amount: number, questId?: string) => void;
  _applyXP: (id: string, amount: number) => void;
  decayXP: (id: string, amount: number) => void;
  processDecay: () => void;
  awakenDormantSkill: (id: string) => void;

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
      isDormant: false,
      dormantAt: undefined,
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

  decayXP: (id, amount) => {
    set(state => {
      const skill = state.skills[id];
      if(!skill) return state;
      const updated: Skill = {
        ...skill,
        xp: Math.max(0, skill.xp - amount),
        lastDecayAt: Date.now(),
        isDormant: skill.xp - amount <= DECAY.MIN_XP_BEFORE_DECAY ? true : skill.isDormant,
      };
      return { skills: { ...state.skills, [id]: updated }}
    });
  },

  processDecay: () => {
    const now = Date.now();
    set(state => {
      const updatedSkills = { ...state.skills };
      let hasChanges = false;

      Object.values(updatedSkills).forEach(skill => {
        if(shouldDecaySkill(skill, now)) {
          const decayAmount = calculateSkillDecay(skill, now);
          if(decayAmount > 0){
            skill.xp = Math.max(0, skill.xp-decayAmount);
            skill.lastDecayAt = now;
            skill.isDormant = checkDormancy(skill, now);
            hasChanges = true;
          }
        }
      });
      return hasChanges ? { skills: updatedSkills } : state;
    });
  },

  awakenDormantSkill: (id) => {
    set(state => {
      const skill = state.skills[id];
      if(!skill || !skill.isDormant) return state;

      const awakened: Skill = {
        ...skill,
        isDormant: false,
        dormantAt: undefined,
        lastSeenAt: Date.now(),
      };

      return {
        skills: { ...state.skills, [id]: awakened }
      };
    });
  },

  getAll: () => Object.values(get().skills),
  getById: (id) => get().skills[id],
  getByKey: (key: string) =>
    Object.values(get().skills).find(skill => skill.key === key),

})) 