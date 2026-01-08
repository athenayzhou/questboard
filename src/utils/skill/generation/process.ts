import type { Quest } from "../../../types/quest";
import type { Evidence } from "../../../types/skills";
import { EvidenceStore } from "../store/evidence";
import { extractPair } from "../../text";
import { DIFFICULTY_EFFORT } from "../../constants";

export type ProcessResult ={
  evidence: Evidence[];
  keys: string[];
}

export function process(
  quest: Quest,
  evidenceStore: EvidenceStore,
): ProcessResult {
  const processed: ProcessResult["evidence"] = []
  const keys = new Set<string>();

  const pairs = extractPair(quest.title);
  for (const {verb, object} of pairs){
    const evidence = {
      id: crypto.randomUUID(),
      verb, 
      object, 
      timespent:
        quest.duration ??
        DIFFICULTY_EFFORT[quest.difficulty],
      origin: `${quest.id}:${quest.title}`,
      timestamp: Date.now(),
    }
    evidenceStore.add(evidence);
    processed.push(evidence);
    keys.add(`${verb}:${object}`);
  }

  return { 
    evidence: processed, 
    keys: [...keys],
  }
}
