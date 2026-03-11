import type { Quest } from "../types/quest";
import { EvidenceStore } from "../store/evidence";
import { ClusterStore } from "../store/cluster";
import { CandidateStore } from "../store/candidate";
import { useSkillStore } from "../store/skill";

import { process } from "../utils/skill/generation/process";
import { aggregate } from "../utils/skill/generation/aggregate";
import { discover } from "../utils/skill/generation/discover";
import { calculateXP } from "../utils/skill/analysis/experience";

import { name } from "../utils/skill/generation/name";

import { showToast } from "../utils/toastAPI";
import { devLog, devError } from "../dev/devLogs";

export function onQuestComplete(
    quest: Quest,
    {
      evidenceStore,
      clusterStore,
      candidateStore,
    } : {
      evidenceStore: EvidenceStore;
      clusterStore: ClusterStore;
      candidateStore: CandidateStore;
    }
  ){
    try{
      devLog('pipeline', 'onQuestComplete started', { questId: quest.id, title: quest.title });

      const xp = calculateXP(quest);
      devLog('pipeline', 'xp calculated', { xp });

      const { keys } = process(quest, evidenceStore);
      devLog('pipeline', 'evidence recorded', { keys });

      const clusters = aggregate(xp, evidenceStore, clusterStore);
      devLog('pipeline', 'evidence aggregated into clusters', { count: clusters?.length ?? 0 });

      discover(clusters, candidateStore);
      devLog('pipeline', 'candidates discovered from clusters');

      //for testing
      const ready = candidateStore.getAll().filter(c => c.state === "ready");
      name(ready, candidateStore);
      devLog("pipeline", "naming auto applied", { readyCount: ready.length });
      //

      for(const key of keys) {
        const skill = useSkillStore.getState().getByKey(key);
        if(skill) {
          useSkillStore.getState().gainXP(skill.id, xp, quest.id);
          devLog("pipeline", "xp applied to existing skill", { skillId: skill.id, xp: xp });
        }
      }

      devLog("pipeline", "onQuestComplete finished");
    } catch (error) {
      devError("pipeline", "onQuestComplete failed", error);
      showToast("error", "something went wrong with processing quest. your quest was still completed.")
    }
    





}