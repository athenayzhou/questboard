import type { Candidate, Skill } from "../../../types/skills";
import { SkillStore } from "../store/skill";

export function promote(candidate: Candidate, name: string, skillStore: SkillStore): Skill {
  const skill: Skill = {
    id: `skill-${candidate.id}`,
    name,
    verbs: candidate.verbs,
    objects: candidate.objects,
    contexts: candidate.contexts,
    proficiency: 0.15,
    xp: 0,
    createdAt: Date.now(),
  };

  skillStore.saveSkill(skill);

  candidate.state = "named";

  return skill;
}