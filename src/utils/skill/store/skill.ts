import type { Skill } from "../../../types/skills";

export class SkillStore {
  private map = new Map<string, Skill>();

  saveSkill(skill: Skill){
    this.map.set(skill.id, skill);
  }

  materializeSkill(skill: Skill) {
    this.map.set(skill.id, skill);
  }

  getAll(): Skill[] {
    return [...this.map.values()];
  }
}