import type { Skill } from "../types/skills";
import { applyXP, xpToLevel } from "../utils/skill/analysis/experience";
import { recordXP } from "./skillActivity";

export class SkillStore {
  private skills = new Map<string, Skill>();

  getAll(): Skill[] {
    return [...this.skills.values()];
  }

  add(skill: Skill) {
    this.skills.set(skill.id, skill);
  }

  gainXP(id:string, amount: number, questId?: string, now = Date.now()) {
    const skill = this.skills.get(id);
    if(!skill) return;
    applyXP(skill, amount);
    // skill.xp += amount;
    // skill.level = xpToLevel(skill.xp);
    // skill.lastSeenAt = now;
    skill.confidence = Math.min (1, skill.confidence + 0.05);

    recordXP({
      id: skill.id,
      name: skill.name,
      amount,
      source: "quest",
      sourceId: questId ?? "unidentified source",
      timestamp: now
    })
  }

  clear(){
    this.skills.clear();
  }
}