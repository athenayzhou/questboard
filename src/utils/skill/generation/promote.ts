import type { Candidate, Skill } from "../../../types/skills";
import { useSkillStore } from "../../../store/skill";
import { CandidateStore } from "../../../store/candidate";
import { CANDIDATE } from "../../constants";
import { devLog } from "../../../dev/devLogs";

export function promote(
  candidate: Candidate,
  name: string,
  candidateStore: CandidateStore,
): Skill {
  const { addSkill, getByKey } = useSkillStore.getState();

  const existing = getByKey(candidate.key);
  if (existing) {
    devLog('skill-gen', `existing skill for VO pair "${candidate.key}" found. skill name: ${existing.name}, xp: ${existing.xp}, proficiency: ${existing.proficiency}`);
    candidateStore.remove(candidate.key);
    return existing;
  }

  const maxClusterCount = candidate.clusters.length
    ? Math.max(...candidate.clusters.map((c) => c.count))
    : 0;
  devLog('skill-gen', `promoting ready candidate into skill! candidate {${candidate.verb}} with [${candidate.objects.join(", ")}] passes depth (max cluster count ${maxClusterCount} >= ${CANDIDATE.MIN_SIZE}) and readiness (${candidate.readiness} >= ${CANDIDATE.EMERGENT_THRESHOLD})`);

  const skill: Skill = {
    id: crypto.randomUUID(),
    key: candidate.key,
    name,
    verb: candidate.verb,
    objects: [...candidate.objects],
    xp: 0,
    proficiency: candidate.readiness,
    firstSeenAt: Date.now(),
    lastSeenAt: Date.now(),
    lastDecayAt: Date.now(),
    isDormant: false,
  };
  candidateStore.remove(candidate.key);
  addSkill(skill);
  devLog('user', `skill gained: "${skill.name}"`);
  devLog('skill-gen', `new skill {${skill.name}} from candidate {${candidate.verb}} with [${candidate.objects.join(", ")}]. xp: ${skill.xp}, proficiency: ${skill.proficiency}`);

  return skill;
}