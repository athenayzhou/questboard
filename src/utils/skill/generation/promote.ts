import type { Candidate, Skill } from "../../../types/skills";
import { SkillStore } from "../../../store/skill";
import { CandidateStore } from "../../../store/candidate";

export function promote(
  candidate: Candidate,
  name: string,
  candidateStore: CandidateStore,
  skillStore: SkillStore
): Skill {

  const skill: Skill = {
    id: crypto.randomUUID(),
    key: candidate.key,
    name,
    verb: candidate.verb,
    objects: [...candidate.objects],
    xp: 0,
    level: 1,
    confidence: candidate.confidence,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
  }
  candidateStore.remove(candidate.key);
  skillStore.add(skill);

  return skill;
}