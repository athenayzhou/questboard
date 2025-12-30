import type { Quest } from "../../../types/quest";
import { EvidenceStore } from "../store/evidence";
import { extractPair } from "../../text";

export function process(
  quest: Quest,
  evidenceStore: EvidenceStore,
){
  const pairs = extractPair(quest.title);
  for (const {verb, object} of pairs){
    evidenceStore.add(verb, object, quest.duration, quest.title)
  }
}
