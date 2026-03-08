import type { Candidate, Skill } from "../../../types/skills";
import { useSkillStore } from "../../../store/skill";
import { CandidateStore } from "../../../store/candidate";

export function promote(
  candidate: Candidate,
  name: string,
  candidateStore: CandidateStore,
): Skill {
  const { addSkill, getByKey } = useSkillStore.getState();

  const existing = getByKey(candidate.key);
  if (existing) {
    candidateStore.remove(candidate.key);
    return existing;
  }

  const skill: Skill = {
    id: crypto.randomUUID(),
    key: candidate.key,
    name,
    verb: candidate.verb,
    objects: [...candidate.objects],
    xp: 0,
    confidence: candidate.confidence,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
    lastDecayAt: Date.now(),
    isDormant: false,
  }
  candidateStore.remove(candidate.key);
  addSkill(skill);

  return skill;
}