import type { Candidate, Skill } from "../../../types/skills";
import { SkillStore } from "../store/skill";

export function promote(
  candidate: Candidate,
  skillStore: SkillStore
): Skill {
  if(candidate.state !== "ready"){
    throw new Error("candidate not ready to be promoted");
  }

  const skill: Skill = {
    id: crypto.randomUUID(),
    name: candidate.suggestedNames ? candidate.suggestedNames[0] : "pending name",
    verb: candidate.verb,
    objects: [...candidate.objects],
    xp: candidate.xp,
    level: candidate.level,
    confidence: candidate.confidence,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
  }

  skillStore.add(skill);

  return skill;
}