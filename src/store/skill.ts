import type { Skill } from "../types/skills";
import { applyXP } from "../utils/skill/analysis/experience";
import { XPEventStoreInstance } from "./xpEvent";


export class SkillStore {
  private skills = new Map<string, Skill>();

  getAll(): Skill[] {
    return [...this.skills.values()];
  }

  add(skill: Skill) {
    this.skills.set(skill.id, skill);
  }

  gainXP(id:string, amount: number, questId?: string) {
    const skill = this.skills.get(id);
    if(!skill) return;
    applyXP(skill, amount);
    skill.confidence = Math.min (1, skill.confidence + 0.05);
    XPEventStoreInstance.recordXP({
      id: skill.id,
      name: skill.name,
      amount,
      source: "quest",
      sourceId: questId ?? "unidentified source",
    })
  }

  clear(){
    this.skills.clear();
  }
}