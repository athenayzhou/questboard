import type { Quest } from "../../../types/quest";
import type { Evidence } from "../../../types/skills";
import { EvidenceStore } from "../../../store/evidence";
import { extractPair } from "../../format/text";

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
  const now = Date.now();
  for (const {verb, object} of pairs){
    const evidence: Evidence = {
      id: crypto.randomUUID(),
      verb,
      object,
      origin: `${quest.id}:${quest.title}`,
      timespent: quest.duration ?? 0,
      timestamp: now,
    };
    evidenceStore.add(evidence);
    processed.push(evidence);
    keys.add(`${verb}:${object}`);
  }

  return { 
    evidence: processed, 
    keys: [...keys],
  }
}
