import type { Skill } from "../../../types/skills";
import { xpToLevel } from "../analysis/experience";

export class SkillStore {
  private skills = new Map<string, Skill>();

  getAll(): Skill[] {
    return [...this.skills.values()];
  }

  add(skill: Skill) {
    this.skills.set(skill.id, skill);
  }

  gainXP(id:string, xp: number, now = Date.now()) {
    const skill = this.skills.get(id);
    if(!skill) return;
    skill.xp += xp;
    skill.level = xpToLevel(skill.xp);
    skill.lastSeenAt = now;
    skill.confidence = Math.min (1, skill.confidence + 0.05);
  }

  clear(){
    this.skills.clear();
  }
}