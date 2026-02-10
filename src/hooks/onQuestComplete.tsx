import type { Quest } from "../types/quest";
import { EvidenceStore } from "../store/evidence";
import { ClusterStore } from "../store/cluster";
import { CandidateStore } from "../store/candidate";
import { SkillStore } from "../store/skill";

import { process } from "../utils/skill/generation/process";
import { aggregate } from "../utils/skill/generation/aggregate";
import { discover } from "../utils/skill/generation/discover";
import { calculateXP } from "../utils/skill/analysis/experience";

import { name } from "../utils/skill/generation/name";

export function onQuestComplete(
    quest: Quest,
    {
      evidenceStore,
      clusterStore,
      candidateStore,
      skillStore,
    } : {
      evidenceStore: EvidenceStore;
      clusterStore: ClusterStore;
      candidateStore: CandidateStore;
      skillStore: SkillStore;
    }
  ){
    const xp = calculateXP(quest);
    const { evidence, keys } = process(quest, evidenceStore);
    const clusters = aggregate(xp, evidenceStore, clusterStore);
    discover(clusters, candidateStore);

  //for testing
    const ready = candidateStore.getAll().filter(c => c.state === "ready");
    name(ready, candidateStore, skillStore);
  //

    for(const skill of skillStore.getAll()) {
      if(!keys.includes(skill.key)) continue;
      skillStore.gainXP(skill.id, xp, quest.id);
    }
}