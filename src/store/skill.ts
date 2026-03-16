import { create } from "zustand";
import type { Skill } from "../types/skills";
import { useXPEventStore } from "./xpEvent";
import { DECAY, MS } from "../utils/constants";
import { calculateSkillDecay, checkDormancy, shouldDecaySkill } from "../utils/skill/analysis/decay";
import { devLog } from "../dev/devLogs";

type SkillState = {
  skills: Record<string, Skill>;
  addSkill: (skill: Skill) => void;
  gainXP: (id: string, amount: number, questId?: string) => void;
  _applyXP: (id: string, amount: number) => void;
  decayXP: (id: string, amount: number) => void;
  processDecay: () => void;
  awakenDormantSkill: (id: string) => void;
  updateName: (id: string, newName: string) => void;

  getAll: () => Skill[];
  getById: (id: string) => Skill | undefined;
  getByKey: (key: string) => Skill | undefined;
}

export const useSkillStore = create<SkillState>((set, get) => ({
  skills: (() => {
    try {
      const raw = localStorage.getItem("skills");
      return raw ? (JSON.parse(raw) as Record<string, Skill>) : {};
    } catch {
      return {};
    }
  })(),

  addSkill: (skill) => {
    set((state) => { 
      const next = {...state.skills, [skill.id]: skill };
      try {
        localStorage.setItem("skills", JSON.stringify(next));
        // eslint-disable-next-line no-empty
      } catch {}
      return { skills: next };
    });
  },

  gainXP: (id, amount, questId) => {
    const skill = get().skills[id];
    if(!skill) return;

    devLog("player", `xp awarded: ${amount} xp`);

    const updated: Skill = {
      ...skill,
      xp: skill.xp + amount,
      proficiency: Math.min(1, skill.proficiency + 0.05),
      lastSeenAt: Date.now(),
      isDormant: false,
      dormantAt: undefined,
    };

    const xpEvent = {
      id: crypto.randomUUID(),
      skillId: id,
      amount,
      source: "quest" as const,
      sourceId: questId ?? "unidentified",
      name: skill.name,
      timestamp: Date.now(),
    };

    set((state) => { 
      const next = { ...state.skills, [id]: updated };
      try {
        localStorage.setItem("skills", JSON.stringify(next));
        // eslint-disable-next-line no-empty
      } catch {}
      return { skills: next };
     });

     useXPEventStore.getState().recordXP(xpEvent);

     devLog("skill-gen", `XPEvent recorded from ${xpEvent.source}: "${xpEvent.sourceId}" (+${amount} xp)`);
  },

  _applyXP: (id, amount) => {
    set(state => {
      const skill = state.skills[id];
      if(!skill) return state;
      const updated: Skill = {
        ...skill,
        xp: skill.xp + amount,
        proficiency: Math.min(1, skill.proficiency + 0.05),
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
      let changedCount = 0;

      Object.values(updatedSkills).forEach(skill => {
        if(shouldDecaySkill(skill, now)) {
          const decayAmount = calculateSkillDecay(skill, now);
          if(decayAmount > 0){
            const daysIdle = (now - skill.lastSeenAt) / MS.DAY;
            const daysUntilDormant = Math.max(0, DECAY.DORMANT_THRESHOLD_DAYS - daysIdle);
            skill.xp = Math.max(0, skill.xp-decayAmount);
            skill.lastDecayAt = now;
            skill.isDormant = checkDormancy(skill, now);
            devLog("decay", `skill "${skill.name}" decayed ⇒ -${decayAmount} xp, total xp: ${skill.xp}, days idle: ${Math.floor(daysIdle)}, days until dormant: ${Math.floor(daysUntilDormant)}`);
            hasChanges = true;
            changedCount += 1;
          }
        }
      });
      if (hasChanges){
        try {
          localStorage.setItem("skills", JSON.stringify(updatedSkills));
          // eslint-disable-next-line no-empty
        } catch {}
      }
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

  updateName: (id, newName) => {
    set(state => {
      const skill = state.skills[id];
      if(!skill) return state;

      const updated = { ...skill, name: newName };
      const next = { ...state.skills, [id]: updated };
      localStorage.setItem("skills", JSON.stringify(next));
      return { skills: next };
    })
  },

  getAll: () => Object.values(get().skills),
  getById: (id) => get().skills[id],
  getByKey: (key: string) =>
    Object.values(get().skills).find(skill => skill.key === key),

})) 