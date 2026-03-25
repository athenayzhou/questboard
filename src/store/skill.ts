import { create } from "zustand";
import type { Skill } from "../types/skills";
import { useXPEventStore } from "./xpEvent";
import { DECAY, MS } from "../utils/constants";
import { calculateSkillDecay, checkDormancy, shouldDecaySkill } from "../utils/skill/analysis/decay";
import { devLog } from "../dev/devLogs";
import { scheduleSkillSync } from "@/lib/apiSkills";

type SkillState = {
  skills: Record<string, Skill>;
  addSkill: (skill: Skill) => void;
  gainXP: (
    id: string,
    amount: number,
    questId?: string,
    questTitle?: string
  ) => void;
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
  skills: {},

  addSkill: (skill) => {
    set((state) => { 
      const next = {...state.skills, [skill.id]: skill };
      scheduleSkillSync();
      return { skills: next };
    });
    void import("@/store/mastery").then((m) =>
      m.useMasteryStore.getState().syncSkillsForVerb(skill.verb ?? ""),
    );
    void import("@/lib/masteryGrant").then((mg) =>
      mg.scheduleMasteryEligibilityCheck(),
    );
  },

  gainXP: (id, amount, questId, questTitle) => {
    const skill = get().skills[id];
    if(!skill) return;

    devLog("user", `xp awarded: ${amount} xp`);

    const updated: Skill = {
      ...skill,
      xp: skill.xp + amount,
      proficiency: Math.min(1, skill.proficiency + 0.05),
      lastSeenAt: Date.now(),
      isDormant: false,
      dormantAt: undefined,
    };

    set((state) => { 
      const next = { ...state.skills, [id]: updated };
      scheduleSkillSync();
      return { skills: next };
     });
     useXPEventStore.getState().recordXP({
      skillId: id,
      amount,
      source: "quest",
      sourceId: questId ?? "unidentified",
      name: skill.name,
      questTitle: questTitle?.trim() || undefined,
    });
     devLog(
      "skill-gen",
      `XPEvent recorded from quest: "${questId ?? "unidentified"}" (+${amount} xp)${questTitle ? ` — ${questTitle}` : ""}`
    );
    void import("@/lib/masteryGrant").then((mg) =>
      mg.scheduleMasteryEligibilityCheck(),
    );
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
    const skill = get().skills[id];
    if (!skill || amount <= 0) return;
    set((state) => {
      const s = state.skills[id];
      if (!s) return state;
      const updated: Skill = {
        ...s,
        xp: Math.max(0, s.xp - amount),
        lastDecayAt: Date.now(),
        isDormant: s.xp - amount <= DECAY.MIN_XP_BEFORE_DECAY ? true : s.isDormant,
      };
      return { skills: { ...state.skills, [id]: updated } };
    });
    useXPEventStore.getState().recordXP({
      skillId: id,
      amount: -amount,
      source: "decay",
      sourceId: "manual-decay",
      name: skill.name,
    });
  },

  processDecay: () => {
    const now = Date.now();
    const decayEvents: { skillId: string; amount: number; name: string }[] = [];
    set((state) => {
      const next: Record<string, Skill> = { ...state.skills };
      let hasChanges = false;

      for (const id of Object.keys(next)) {
        const skill = next[id];
        if (!shouldDecaySkill(skill, now)) continue;
        const decayAmount = calculateSkillDecay(skill, now);
        if (decayAmount <= 0) continue;

        const daysIdle = (now - skill.lastSeenAt) / MS.DAY;
        const daysUntilDormant = Math.max(
          0,
          DECAY.DORMANT_THRESHOLD_DAYS - daysIdle
        );
        const newXp = Math.max(0, skill.xp - decayAmount);
        const updated: Skill = {
          ...skill,
          xp: newXp,
          lastDecayAt: now,
          isDormant: checkDormancy({ ...skill, xp: newXp }, now),
        };
        next[id] = updated;
        decayEvents.push({ skillId: id, amount: decayAmount, name: skill.name });
        devLog(
          "decay",
          `skill "${skill.name}" decayed ⇒ -${decayAmount} xp, total xp: ${newXp}, days idle: ${Math.floor(daysIdle)}, days until dormant: ${Math.floor(daysUntilDormant)}`
        );
        hasChanges = true;
      }

      if (hasChanges) {
        scheduleSkillSync();
        return { skills: next };
      }
      return state;
    });

    for (const e of decayEvents) {
      useXPEventStore.getState().recordXP({
        skillId: e.skillId,
        amount: -e.amount,
        source: "decay",
        sourceId: "idle",
        name: e.name,
      });
    }
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
      scheduleSkillSync();
      return { skills: next };
    })
  },

  getAll: () => Object.values(get().skills),
  getById: (id) => get().skills[id],
  getByKey: (key: string) =>
    Object.values(get().skills).find(skill => skill.key === key),

})) 