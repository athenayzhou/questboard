import type { Quest } from "../../../types/quest";
import { EvidenceStore } from "../store/evidence";
import { extractPair } from "../../text";
import { DIFFICULTY_EFFORT } from "../../constants";

export function process(
  quest: Quest,
  evidenceStore: EvidenceStore,
){
  const pairs = extractPair(quest.title);
  for (const {verb, object} of pairs){
    evidenceStore.add({
      verb, 
      object, 
      timespent:
        quest.duration ??
        DIFFICULTY_EFFORT[quest.difficulty],
      origin: `${quest.id}:${quest.title}`,
    })
  }
}
