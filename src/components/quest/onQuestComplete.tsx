import type { Quest } from "../../types/quest";
import { EvidenceStore } from "../../utils/skill/store/evidence";
import { ClusterStore } from "../../utils/skill/store/cluster";
import { CandidateStore } from "../../utils/skill/store/candidate";
import { SkillStore } from "../../utils/skill/store/skill";

import { process } from "../../utils/skill/generation/process";
import { aggregate } from "../../utils/skill/generation/aggregate";
import { discover } from "../../utils/skill/generation/discover";
import { promote } from "../../utils/skill/generation/promote";

export function onQuestComplete(
    quest: Quest,
    {
      evidenceStore,
      clusterStore,
      candidateStore,
      skillStore,
      now = Date.now()
    } : {
      evidenceStore: EvidenceStore;
      clusterStore: ClusterStore;
      candidateStore: CandidateStore;
      skillStore: SkillStore;
      now?: number;
    }
  ){
    process(quest, evidenceStore);
    const clusters = aggregate(evidenceStore, clusterStore);
    const candidates = discover(clusters, candidateStore, now);
    for(const candidate of candidates) {
      if(candidate.state === "ready"){
        const skill = promote(candidate, skillStore);
        candidateStore.remove(candidate.key);
      }
    }
}