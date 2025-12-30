import type { Skill } from "../../../types/skills";

export class SkillStore {
  private skills = new Map<string, Skill>();

  getAll(): Skill[] {
    return [...this.skills.values()];
  }
  
  get(id: string): Skill | undefined {
    return this.skills.get(id);
  }

  add(skill: Skill) {
    this.skills.set(skill.id, skill);
  }

  clear(){
    this.skills.clear();
  }
}