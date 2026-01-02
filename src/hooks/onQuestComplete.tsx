import type { Quest } from "../types/quest";
import { EvidenceStore } from "../utils/skill/store/evidence";
import { ClusterStore } from "../utils/skill/store/cluster";
import { CandidateStore } from "../utils/skill/store/candidate";
import { SkillStore } from "../utils/skill/store/skill";

import { process } from "../utils/skill/generation/process";
import { aggregate } from "../utils/skill/generation/aggregate";
import { discover } from "../utils/skill/generation/discover";
import { promote } from "../utils/skill/generation/promote";
import { calculateXP } from "../utils/skill/analysis/experience";

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
      now?: number;
    }
  ){
    const xp = calculateXP(quest);
    process(quest, evidenceStore);
    const clusters = aggregate(xp, evidenceStore, clusterStore);
    const candidates = discover(clusters, candidateStore);
    for(const candidate of candidates) {
      if(candidate.state === "ready"){
        const skill = promote(candidate, skillStore);
        skillStore.gainXP(skill.id, xp);
        candidateStore.remove(candidate.key);
      }
    }
}