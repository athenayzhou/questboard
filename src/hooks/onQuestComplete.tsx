import type { Quest } from "../types/quest";
import { EvidenceStore } from "../store/evidence";
import { ClusterStore } from "../store/cluster";
import { CandidateStore } from "../store/candidate";
import { useSkillStore } from "../store/skill";

import { process } from "../utils/skill/generation/process";
import { aggregate } from "../utils/skill/generation/aggregate";
import { discover } from "../utils/skill/generation/discover";
import { calculateXP } from "../utils/skill/analysis/experience";
import { CANDIDATE } from "../utils/constants";

import { autoNameSkill } from "../utils/skill/generation/name";
import { useNameStore } from "../store/name";
import { useSettingsStore } from "../store/settings";
import { NameSkill } from "../components/secondary/NameSkill";

import { showToast } from "../utils/toast";
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
      const xp = calculateXP(quest);
      devLog('skill-gen', `quest "${quest.title}" complete, xp to be gained: ${xp}`);

      const { keys, evidence: newEvidence } = process(quest, evidenceStore);

      const clusters = aggregate(xp, newEvidence, clusterStore);
      discover(clusters, candidateStore);

      const autoNameEnabled = useSettingsStore.getState().autoNameSkills;
      const readyCandidates = candidateStore.getAll().filter(c => c.state === "ready");

      const maxClusterCount = (c: { clusters: { count: number }[] }) =>
        c.clusters.length ? Math.max(...c.clusters.map((cl) => cl.count)) : 0;
      const ready = readyCandidates.filter(
        (c) => maxClusterCount(c) >= CANDIDATE.MIN_SIZE
      );

      if (ready.length > 0) {
        if (autoNameEnabled) {
          autoNameSkill(ready, candidateStore);
        } else {
          const candidatesToName = ready.map((candidate) => ({
            candidate,
            xp,
            questId: quest.id,
            questTitle: quest.title,
          }));
          if (candidatesToName.length > 0) {
            useNameStore.getState().showPrompt(candidatesToName);
          }
        }
      }

      const { getByKey, getAll } = useSkillStore.getState();
      for (const key of keys) {
        let skill = getByKey(key);
        if (!skill) {
          const verb = key.includes(":") ? key.slice(0, key.indexOf(":")) : key;
          const byVerb = getAll().filter((s) => s.verb === verb);
          skill = byVerb[0];
        }
        if (skill) {
          useSkillStore.getState().gainXP(
            skill.id,
            xp,
            quest.id,
            quest.title
          );
          devLog(
            "skill-gen",
            `skill for VO pair "${key}": ${skill.name}, xp after award path scheduled`
          );
        }
      }
      if(!useNameStore.getState().isNaming){
        showToast('success', `quest "${quest.title}" completed`);
      }

    } catch (error) {
      devError("pipeline", "onQuestComplete failed", error);
      showToast("error", "something went wrong with processing quest. your quest was still completed.")
    }

}


export function NamePrompt(){
  const { isNaming, pendingNaming, currentNameIndex, completeNaming } = useNameStore();
  const currentItem = pendingNaming[currentNameIndex];

  return(
    <NameSkill
      isOpen={isNaming}
      candidate={currentItem?.candidate}
      onNameSelected={completeNaming}
      onCancel={() => useNameStore.getState().skipNaming()}
    />
  );
}