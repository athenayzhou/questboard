import type { Quest } from "../../types/quest";
import { processQuest } from "../../utils/ProcessQuest";
import { evidenceStore, candidateStore, skillStore } from "../../utils/skill/store/stores";

export function onQuestComplete(quest: Quest) {
  processQuest(quest, {
    evidenceStore,
    candidateStore,
    skillStore,
    autoPromote: true,
  })
}